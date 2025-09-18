'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ConnectionStatus } from './connection-status';
import { InterruptButton } from './interrupt-button';
import { ModeSelector } from './mode-selector';
import { TranscriptDisplay } from './transcript-display';
import { VideoPreview } from './video-preview';
import { VisualContextIndicator } from './visual-context-indicator';
import { backendUrl } from '../lib/config';
import { RealtimeCoordinator } from '../lib/realtimeCoordinator';
import { VisualProcessor } from '../lib/visualProcessor';
import type { CaptureMode, ConnectionState, TranscriptEntry, VisualContextItem } from '../lib/types';

export function AssistantApp() {
  const coordinator = useMemo(() => new RealtimeCoordinator(), []);
  const visualProcessorRef = useRef<VisualProcessor | null>(null);
  const [mode, setMode] = useState<CaptureMode>('screen');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [visualContexts, setVisualContexts] = useState<VisualContextItem[]>([]);
  const [visualActive, setVisualActive] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const latestTranscriptRef = useRef('');
  const connectionRef = useRef<ConnectionState>('idle');
  const framePipeline = useRef(Promise.resolve());

  useEffect(() => {
    const teardown = coordinator.onTranscripts((entries) => {
      setTranscripts(entries);
      const latest = entries.at(-1);
      latestTranscriptRef.current = latest?.text ?? '';
    });
    const offStatus = coordinator.onStatus((state) => {
      connectionRef.current = state;
      setConnectionState(state);
    });
    const offVisual = coordinator.onVisual((context) => {
      setVisualContexts((prev) => [context, ...prev].slice(0, 10));
    });
    const offError = coordinator.onError((message) => setError(message));
    return () => {
      teardown();
      offStatus();
      offVisual();
      offError();
    };
  }, [coordinator]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const processor = new VisualProcessor();
    visualProcessorRef.current = processor;
    const unsubscribe = processor.onStreamChange(() => {
      setScreenStream(processor.getStream('screen') ?? null);
      setCameraStream(processor.getStream('camera') ?? null);
    });
    return () => {
      unsubscribe();
      processor.stop();
      visualProcessorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const processor = visualProcessorRef.current;
    if (!processor) {
      return;
    }
    if (connectionState === 'connected') {
      processor.switchMode(mode).catch(() => undefined);
    }
  }, [mode, connectionState]);

  useEffect(() => {
    const processor = visualProcessorRef.current;
    if (!processor) {
      return;
    }
    processor.setFrameInterval(transcripts.length > 0 ? 500 : 1500);
  }, [transcripts.length]);

  const connect = async () => {
    if (connectionState === 'connecting' || isConnecting) {
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await coordinator.connect({ mode, audioStream });
      const processor = visualProcessorRef.current;
      if (processor) {
        processor.setFrameInterval(transcripts.length > 0 ? 500 : 1000);
        await processor.start(mode, async (frame) => {
          framePipeline.current = framePipeline.current.then(() => handleFrame(frame)).catch(() => undefined);
          return framePipeline.current;
        });
        setVisualActive(true);
      }
    } catch (connectError) {
      console.error(connectError);
      setError('Failed to start realtime session. Please allow microphone and screen access.');
      await coordinator.disconnect();
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    visualProcessorRef.current?.stop();
    setVisualActive(false);
    await coordinator.disconnect();
  };

  const handleFrame = async (frame: { base64: string; capturedAt: number; source: 'screen' | 'camera' }) => {
    if (connectionRef.current !== 'connected') {
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/api/frames/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frame: frame.base64,
          source: frame.source,
          transcriptSnippet: latestTranscriptRef.current
        })
      });
      if (!response.ok) {
        throw new Error('Failed to analyze frame');
      }
      const payload = await response.json();
      const visualItem: VisualContextItem = {
        description: payload.description,
        capturedAt: frame.capturedAt,
        source: frame.source
      };
      setVisualContexts((prev) => [visualItem, ...prev].slice(0, 10));
      await coordinator.sendVisualContext({
        description: payload.description,
        frameBase64: frame.base64,
        capturedAt: frame.capturedAt
      });
      setVisualActive(true);
    } catch (error) {
      console.error('Visual frame processing error', error);
      setVisualActive(false);
    }
  };

  const handleInterrupt = async () => {
    await coordinator.interrupt();
    visualProcessorRef.current?.stop();
    setVisualActive(false);
    if (connectionState === 'connected') {
      const processor = visualProcessorRef.current;
      if (processor) {
        await processor.start(mode, async (frame) => {
          framePipeline.current = framePipeline.current.then(() => handleFrame(frame)).catch(() => undefined);
          return framePipeline.current;
        });
        setVisualActive(true);
      }
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Realtime Vision Assistant</h1>
          <p className="text-white/60">
            Low-latency multimodal assistant combining OpenAI&apos;s realtime voice API with continuous visual perception.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <ConnectionStatus status={connectionState} />
          <ModeSelector current={mode} onChange={setMode} />
        </div>
      </header>

      {error ? (
        <Card className="border-rose-500/40 bg-rose-500/10 text-sm text-rose-100">{error}</Card>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <VideoPreview screenStream={screenStream ?? undefined} cameraStream={cameraStream ?? undefined} mode={mode} />
        <TranscriptDisplay messages={transcripts} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <VisualContextIndicator contexts={visualContexts} active={visualActive} />
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Session controls</h2>
          <p className="text-sm text-white/60">
            Connect to start voice conversation. Visual observations run at 1–2 FPS with smart caching and automatic
            context injection.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {connectionState === 'connected' ? (
              <Button type="button" variant="secondary" onClick={disconnect}>
                Disconnect
              </Button>
            ) : (
              <Button type="button" onClick={connect} disabled={isConnecting}>
                {isConnecting ? 'Connecting…' : 'Start conversation'}
              </Button>
            )}
            <InterruptButton onClick={handleInterrupt} disabled={connectionState !== 'connected'} />
          </div>
        </Card>
        <Card className="flex flex-col gap-3 text-sm text-white/70">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Ephemeral realtime session with secure key exchange via the backend.</li>
            <li>Dual-queue pipeline keeps audio and visual updates synchronized.</li>
            <li>Adaptive frame sampling, caching, and function calls for deep dives.</li>
            <li>Graceful degradation keeps voice chat alive when visuals pause.</li>
          </ul>
        </Card>
      </section>
    </main>
  );
}
