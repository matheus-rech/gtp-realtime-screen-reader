'use client';

import { useEffect, useState } from 'react';
import VideoPreview from './VideoPreview';
import TranscriptDisplay from './TranscriptDisplay';
import VisualContextIndicator from './VisualContextIndicator';
import ModeSelector from './ModeSelector';
import ConnectionStatus from './ConnectionStatus';
import InterruptButton from './InterruptButton';
import { useRealtimeSession } from '@/lib/hooks/useRealtimeSession';

const AssistantApp = () => {
  const {
    connectionState,
    connect,
    disconnect,
    sendText,
    handleInterrupt,
    setMode,
    mode,
    transcript,
    visualContexts,
    visualActive,
    latencyMs,
    previewFrame
  } = useRealtimeSession('screen');

  const [message, setMessage] = useState('');

  useEffect(() => {
    void connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }
    sendText(message.trim());
    setMessage('');
  };

  return (
    <div className="w-full max-w-6xl rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Realtime Voice + Vision Assistant</h1>
          <p className="text-sm text-slate-400">
            Powered by OpenAI Realtime API. Speak naturally while the assistant observes your screen or camera.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ConnectionStatus state={connectionState} latencyMs={latencyMs} />
          <ModeSelector mode={mode} onChange={(next) => void setMode(next)} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VideoPreview mode={mode} previewFrame={previewFrame} />
        <TranscriptDisplay messages={transcript} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <VisualContextIndicator active={visualActive} contexts={visualContexts} />
        <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
            <label htmlFor="message" className="text-xs uppercase tracking-widest text-slate-400">
              Manual prompt
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask the assistant to describe what it sees or request help."
              className="min-h-[96px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-100 focus:border-primary/60 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/80"
              >
                Send Prompt
              </button>
              <InterruptButton onClick={handleInterrupt} />
            </div>
          </form>
          <div className="rounded-xl bg-slate-900/60 p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">Tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Use the mode selector to switch between screen, camera, or hybrid monitoring.</li>
              <li>The assistant automatically injects visual context when significant changes are detected.</li>
              <li>Interrupt at any time to clear audio buffers and pause visual capture.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantApp;
