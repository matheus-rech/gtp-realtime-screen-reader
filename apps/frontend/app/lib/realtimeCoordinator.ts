import { backendUrl } from './config';
import { ContextManager } from './contextManager';
import { DualQueue } from './dualQueue';
import type { CaptureMode, ConnectionState, TranscriptEntry, VisualContextItem } from './types';

interface ConnectOptions {
  mode: CaptureMode;
  audioStream: MediaStream;
  instructions?: string;
}

interface VisualPayload {
  description: string;
  frameBase64: string;
  capturedAt: number;
}

interface ConversationContent {
  type?: string;
  text?: string;
  value?: string;
  image_base64?: string;
}

interface ConversationMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: ConversationContent[];
  text?: string;
  created_at?: number;
}

interface ConversationEvent {
  conversation?: {
    messages?: ConversationMessage[];
    items?: ConversationMessage[];
  };
}

interface RealtimeClientLike {
  connect: () => Promise<void>;
  close: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
  off?: (event: string, handler: (payload: unknown) => void) => void;
  send?: (payload: unknown) => Promise<void> | void;
  createPeerConnection?: () => RTCPeerConnection;
}

interface EphemeralKey {
  value: string;
  expires_at: number;
}

interface EphemeralKeyResponse {
  client_secret: EphemeralKey;
}

type Listener<T> = (payload: T) => void;

const defaultInstructions = `You are a helpful assistant with visual perception. When users ask about what you see, reference the visual context provided. Be natural and conversational about visual elements.`;

const mapHttpToWs = (url: string) => {
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://');
  }
  if (url.startsWith('http://')) {
    return url.replace('http://', 'ws://');
  }
  return url;
};

const isConversationEvent = (payload: unknown): payload is ConversationEvent =>
  typeof payload === 'object' && payload !== null && 'conversation' in payload;

const extractMessageText = (message: ConversationMessage): string => {
  if (Array.isArray(message.content) && message.content.length > 0) {
    return message.content
      .filter((content) => typeof content?.type === 'string' && content.type.includes('text'))
      .map((content) => content.text ?? content.value ?? '')
      .join(' ')
      .trim();
  }
  return message.text ?? '';
};

export class RealtimeCoordinator {
  private client: RealtimeClientLike | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private visualSocket: WebSocket | null = null;
  private readonly transcriptListeners = new Set<Listener<TranscriptEntry[]>>();
  private readonly statusListeners = new Set<Listener<ConnectionState>>();
  private readonly visualListeners = new Set<Listener<VisualContextItem>>();
  private readonly errorListeners = new Set<Listener<string>>();
  private readonly contextManager = new ContextManager();
  private readonly queue = new DualQueue<string, VisualPayload>();
  private transcripts: TranscriptEntry[] = [];
  private state: ConnectionState = 'idle';
  private mode: CaptureMode = 'screen';
  private isActive = false;

  constructor(private readonly voice = 'marin') {}

  get connectionState(): ConnectionState {
    return this.state;
  }

  get dualQueue(): DualQueue<string, VisualPayload> {
    return this.queue;
  }

  onTranscripts(listener: Listener<TranscriptEntry[]>): () => void {
    this.transcriptListeners.add(listener);
    listener(this.transcripts);
    return () => this.transcriptListeners.delete(listener);
  }

  onStatus(listener: Listener<ConnectionState>): () => void {
    this.statusListeners.add(listener);
    listener(this.state);
    return () => this.statusListeners.delete(listener);
  }

  onVisual(listener: Listener<VisualContextItem>): () => void {
    this.visualListeners.add(listener);
    return () => this.visualListeners.delete(listener);
  }

  onError(listener: Listener<string>): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private emitTranscripts() {
    for (const listener of this.transcriptListeners) {
      listener(this.transcripts);
    }
  }

  private emitStatus(state: ConnectionState) {
    this.state = state;
    for (const listener of this.statusListeners) {
      listener(state);
    }
  }

  private emitVisualContext(payload: VisualContextItem) {
    for (const listener of this.visualListeners) {
      listener(payload);
    }
  }

  private emitError(message: string) {
    for (const listener of this.errorListeners) {
      listener(message);
    }
  }

  async connect(options: ConnectOptions) {
    if (typeof window === 'undefined') {
      return;
    }

    this.mode = options.mode;
    this.emitStatus('connecting');

    try {
      this.queue.visualQueue.resume();
      this.queue.audioQueue.resume();
      const ephemeralKey = await this.fetchEphemeralKey(options.mode, options.instructions);
      const { RealtimeClient } = await import('@openai/agents');
      const ClientCtor = RealtimeClient as unknown as new (options: Record<string, unknown>) => RealtimeClientLike;
      this.client = new ClientCtor({
        apiKey: ephemeralKey.value,
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: this.voice,
        conversation: {
          instructions: options.instructions ?? defaultInstructions
        }
      });

      this.client.on('error', (event: unknown) => {
        const message =
          typeof event === 'object' && event !== null && 'message' in event
            ? String((event as { message?: unknown }).message ?? 'Realtime client error')
            : 'Realtime client error';
        this.emitError(message);
        this.emitStatus('error');
      });

      this.client.on('conversation.updated', (event: unknown) => {
        if (!isConversationEvent(event)) {
          return;
        }
        const items = event.conversation?.messages ?? event.conversation?.items ?? [];
        const transcripts: TranscriptEntry[] = items
          .map((item) => {
            if (!item) {
              return null;
            }
            const text = extractMessageText(item);
            if (!text) {
              return null;
            }
            return {
              id: item.id ?? `${item.role ?? 'assistant'}-${item.created_at ?? Date.now()}`,
              role: (item.role ?? 'assistant') as TranscriptEntry['role'],
              text,
              timestamp: item.created_at ? item.created_at * 1000 : Date.now()
            } satisfies TranscriptEntry;
          })
          .filter((item): item is TranscriptEntry => Boolean(item));

        this.transcripts = transcripts;
        this.emitTranscripts();

        const latest = transcripts.at(-1);
        if (latest) {
          void this.contextManager.update(latest.text, undefined, latest.timestamp);
          this.queue.audioQueue.enqueue(latest.text);
        }
      });

      this.peerConnection = this.client.createPeerConnection?.() ?? null;
      if (this.peerConnection) {
        options.audioStream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, options.audioStream);
        });
        this.peerConnection.addEventListener('track', (event) => {
          const [stream] = event.streams;
          if (!stream) return;
          if (!this.audioElement) {
            this.audioElement = document.createElement('audio');
            this.audioElement.autoplay = true;
            this.audioElement.playsInline = true;
            document.body.appendChild(this.audioElement);
          }
          this.audioElement.srcObject = stream;
          void this.audioElement.play().catch(() => undefined);
        });
      }

      await this.client.connect();
      this.isActive = true;
      this.emitStatus('connected');

      this.openVisualSocket();
      void this.pumpVisualQueue();
    } catch (error) {
      console.error('Failed to connect to realtime session', error);
      this.emitError('Unable to create realtime session. Check backend logs.');
      this.emitStatus('error');
    }
  }

  async disconnect() {
    this.isActive = false;
    this.queue.visualQueue.pause();
    this.queue.audioQueue.pause();
    this.queue.visualQueue.clear();
    this.queue.audioQueue.clear();
    this.queue.visualQueue.resume();
    this.queue.visualQueue.enqueue({ description: '', frameBase64: '', capturedAt: Date.now() });
    this.peerConnection?.close();
    this.peerConnection = null;
    this.client?.close?.();
    this.client = null;
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement.remove();
      this.audioElement = null;
    }
    this.visualSocket?.close();
    this.visualSocket = null;
    this.emitStatus('idle');
  }

  async interrupt() {
    this.queue.onInterruption();
    await this.client?.send?.({ type: 'response.cancel' });
  }

  async sendVisualContext(payload: VisualPayload) {
    if (!this.client) {
      return;
    }
    const latestTranscript = this.contextManager.latestTranscriptSnippet();
    await this.contextManager.update(latestTranscript, payload.description, payload.capturedAt);

    this.queue.visualQueue.enqueue(payload);
  }

  private async pumpVisualQueue() {
    while (this.isActive) {
      const payload = await this.queue.visualQueue.dequeue();
      if (!this.isActive) {
        break;
      }
      if (!payload.description) {
        continue;
      }
      await this.sendVisualPayload(payload).catch((error) => {
        console.error('Failed to send visual context', error);
        this.emitError('Failed to push visual context to conversation');
      });
    }
  }

  private async sendVisualPayload(payload: VisualPayload) {
    if (!this.client) {
      return;
    }

    const content: ConversationContent[] = [
      {
        type: 'input_text',
        text: `Visual update (${this.mode}) at ${new Date(payload.capturedAt).toLocaleTimeString()}: ${payload.description}`
      }
    ];

    if (payload.frameBase64) {
      content.push({ type: 'input_image', image_base64: payload.frameBase64 });
    }

    await this.client.send?.({
      type: 'conversation.item.create',
      item: {
        type: 'input_text',
        role: 'system',
        content
      }
    });

    await this.client.send?.({ type: 'response.create' });
  }

  private async fetchEphemeralKey(mode: CaptureMode, instructions?: string): Promise<EphemeralKey> {
    const response = await fetch(`${backendUrl}/api/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mode, instructions: instructions ?? defaultInstructions })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ephemeral key');
    }

    const json = (await response.json()) as EphemeralKeyResponse;
    return json.client_secret;
  }

  private openVisualSocket() {
    const wsUrl = `${mapHttpToWs(backendUrl)}/ws/visual`;
    try {
      this.visualSocket = new WebSocket(wsUrl);
      this.visualSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as VisualPayload;
          this.emitVisualContext({
            description: data.description,
            capturedAt: data.capturedAt,
            source: this.mode
          });
        } catch (error) {
          console.error('Failed to parse visual websocket message', error);
        }
      };
      this.visualSocket.onerror = () => {
        this.emitError('Visual relay connection failed');
      };
    } catch (error) {
      console.error('Failed to open visual websocket', error);
    }
  }
}
