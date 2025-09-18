'use client';

import type { TranscriptMessage } from '@/types/realtime';

type TranscriptDisplayProps = {
  messages: TranscriptMessage[];
};

const TranscriptDisplay = ({ messages }: TranscriptDisplayProps) => {
  return (
    <div className="flex h-64 w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      {messages.length === 0 && <p className="text-sm text-slate-400">Say something to start the conversation.</p>}
      {messages.map((message) => (
        <div key={message.id} className="space-y-1">
          <div className="text-xs uppercase tracking-widest text-slate-500">{message.role}</div>
          <div className="rounded-xl bg-slate-800/60 p-3 text-sm text-slate-100 shadow-sm">{message.content}</div>
          <div className="text-right text-[10px] text-slate-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TranscriptDisplay;
