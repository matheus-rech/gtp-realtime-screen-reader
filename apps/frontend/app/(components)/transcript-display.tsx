'use client';

import { Card } from '../../components/ui/card';
import type { TranscriptEntry } from '../lib/types';

interface Props {
  messages: TranscriptEntry[];
}

export function TranscriptDisplay({ messages }: Props) {
  return (
    <Card className="flex max-h-64 flex-1 flex-col gap-2 overflow-y-auto">
      <div className="text-sm font-medium text-white/80">Conversation transcript</div>
      <div className="flex flex-1 flex-col gap-2 text-sm">
        {messages.length === 0 ? (
          <p className="text-white/50">Waiting for conversation to start…</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="rounded-xl bg-black/20 px-4 py-3"
              data-role={message.role}
            >
              <div className="text-xs uppercase tracking-wide text-white/60">{message.role}</div>
              <div className="whitespace-pre-wrap text-white/90">{message.text}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
