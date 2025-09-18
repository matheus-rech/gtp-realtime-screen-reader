'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeClient } from '@openai/agents';
import { AudioController } from '@/lib/audio/AudioController';
import { VisualProcessor } from '@/lib/visual/VisualProcessor';
import { appConfig } from '@/lib/config';
import type { AssistantMode, ConnectionState, TranscriptMessage, VisualContext } from '@/types/realtime';

export type UseRealtimeSessionResult = {
  connectionState: ConnectionState;
  transcript: TranscriptMessage[];
  visualContexts: VisualContext[];
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
  handleInterrupt: () => void;
  setMode: (mode: AssistantMode) => Promise<void>;
  mode: AssistantMode;
  visualActive: boolean;
  latencyMs: number | null;
  previewFrame: string | null;
};

const buildWebSocketUrl = (baseUrl: string, path: string) => {
  const url = new URL(path, baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
};

export const useRealtimeSession = (initialMode: AssistantMode): UseRealtimeSessionResult => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [visualContexts, setVisualContexts] = useState<VisualContext[]>([]);
  const [mode, setModeState] = useState<AssistantMode>(initialMode);
  const [visualActive, setVisualActive] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);

  const clientRef = useRef<any | null>(null);
  const visualProcessorRef = useRef<VisualProcessor | null>(null);
  const audioRef = useRef<AudioController | null>(null);
  const visualSocketRef = useRef<WebSocket | null>(null);
  const pendingTextRef = useRef<string | null>(null);

  const teardownVisualSocket = useCallback(() => {
    visualSocketRef.current?.close();
    visualSocketRef.current = null;
  }, []);

  const ensureVisualSocket = useCallback(() => {
    if (visualSocketRef.current && visualSocketRef.current.readyState === WebSocket.OPEN) {
      return visualSocketRef.current;
    }
    teardownVisualSocket();
    const socket = new WebSocket(buildWebSocketUrl(appConfig.backendUrl, appConfig.visualSocketPath));
    socket.onopen = () => {
      setVisualActive(true);
    };
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { type: string; description?: string; frame?: { capturedAt: number; source: 'screen' | 'camera' } };
      if (payload.type === 'visual-context' && payload.description && payload.frame) {
        setVisualContexts((contexts) => {
          const next = [
            { description: payload.description, capturedAt: payload.frame.capturedAt, source: payload.frame.source },
            ...contexts
          ].slice(0, 10);
          return next;
        });
      }
      if (payload.type === 'interrupted') {
        setVisualActive(false);
      }
    };
    socket.onclose = () => {
      setVisualActive(false);
    };
    socket.onerror = () => {
      setVisualActive(false);
    };
    visualSocketRef.current = socket;
    return socket;
  }, [teardownVisualSocket]);

  const attachRealtimeListeners = useCallback((client: any) => {
    if (!client) {
      return;
    }
    client.on('response.delta', (event: any) => {
      const { delta } = event;
      if (delta?.type === 'output_text.delta') {
        pendingTextRef.current = (pendingTextRef.current ?? '') + (delta.text ?? '');
      }
    });

    client.on('response.completed', (event: any) => {
      if (pendingTextRef.current) {
        setTranscript((messages) => [
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: pendingTextRef.current ?? '',
            timestamp: Date.now()
          },
          ...messages
        ]);
        pendingTextRef.current = null;
      }
      if (event?.response?.latency_ms) {
        setLatencyMs(event.response.latency_ms);
      }
    });

    client.on('conversation.item.created', (event: any) => {
      const item = event.item;
      if (item?.role === 'user' && item?.content?.[0]?.type === 'input_text') {
        setTranscript((messages) => [
          {
            id: item.id ?? crypto.randomUUID(),
            role: 'user',
            content: item.content[0].text ?? '',
            timestamp: Date.now()
          },
          ...messages
        ]);
      }
    });

    client.on('error', (error: unknown) => {
      console.error('Realtime client error', error);
      setConnectionState('error');
    });
  }, []);

  const startVisualPipeline = useCallback(
    async (nextMode: AssistantMode) => {
      const processor = visualProcessorRef.current ?? new VisualProcessor({
        onFrame: (frame) => {
          const socket = ensureVisualSocket();
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: 'frame',
                payload: { base64: frame.base64, source: frame.source, quick: true }
              })
            );
          }
          setPreviewFrame(frame.base64);
        }
      });
      visualProcessorRef.current = processor;

      let stream: MediaStream;
      if (nextMode === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 2, width: 1920, height: 1080 } });
      } else if (nextMode === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ video: { frameRate: 2, width: 1280, height: 720 } });
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1, width: 1920, height: 1080 } });
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { frameRate: 1, width: 640, height: 480 } });
        const [screenTrack] = screenStream.getVideoTracks();
        const [cameraTrack] = cameraStream.getVideoTracks();
        stream = new MediaStream([screenTrack, cameraTrack]);
      }
      await processor.start(stream, nextMode);
    },
    [ensureVisualSocket]
  );

  const initializeRealtimeClient = useCallback(async () => {
    setConnectionState('connecting');
    const response = await fetch(`${appConfig.backendUrl}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const payload = await response.json();
    const client = new RealtimeClient({
      apiKey: payload.client_secret?.value,
      model: 'gpt-4o-realtime-preview-2024-12-17',
      instructions:
        'You are a helpful assistant with visual perception. Reference the visual context provided when responding to the user.'
    });

    attachRealtimeListeners(client);
    await client.connect();
    clientRef.current = client;
    setConnectionState('connected');

    const audio = new AudioController({
      onChunk: (chunk) => {
        const socket = ensureVisualSocket();
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: 'audio',
              payload: { id: chunk.id, timestamp: chunk.timestamp }
            })
          );
        }
        client.sendRealtime?.({
          type: 'input_audio_buffer.append',
          audio: btoa(String.fromCharCode(...new Uint8Array(chunk.data)))
        });
        client.sendRealtime?.({ type: 'input_audio_buffer.commit' });
      }
    });
    audioRef.current = audio;
    await audio.start();
    await startVisualPipeline(mode);
  }, [attachRealtimeListeners, ensureVisualSocket, mode, startVisualPipeline]);

  const connect = useCallback(async () => {
    try {
      await initializeRealtimeClient();
    } catch (error) {
      console.error(error);
      setConnectionState('error');
    }
  }, [initializeRealtimeClient]);

  const disconnect = useCallback(() => {
    setConnectionState('disconnected');
    clientRef.current?.disconnect?.();
    clientRef.current = null;
    audioRef.current?.stop();
    audioRef.current = null;
    visualProcessorRef.current?.stop();
    visualProcessorRef.current = null;
    teardownVisualSocket();
    setPreviewFrame(null);
  }, [teardownVisualSocket]);

  const sendText = useCallback((text: string) => {
    if (!clientRef.current) {
      return;
    }
    clientRef.current.sendUserMessageContent?.([{ type: 'input_text', text }]);
    setTranscript((messages) => [
      { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() },
      ...messages
    ]);
  }, []);

  const handleInterrupt = useCallback(() => {
    audioRef.current?.onInterruption();
    const socket = ensureVisualSocket();
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'interrupt' }));
    }
    clientRef.current?.sendRealtime?.({ type: 'response.cancel' });
  }, [ensureVisualSocket]);

  const updateMode = useCallback(
    async (nextMode: AssistantMode) => {
      setModeState(nextMode);
      visualProcessorRef.current?.stop();
      await startVisualPipeline(nextMode);
    },
    [startVisualPipeline]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    transcript,
    visualContexts,
    connect,
    disconnect,
    sendText,
    handleInterrupt,
    setMode: updateMode,
    mode,
    visualActive,
    latencyMs,
    previewFrame
  };
};
