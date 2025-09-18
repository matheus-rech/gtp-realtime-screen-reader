'use client';

import { Card } from '../../components/ui/card';
import type { VisualContextItem } from '../lib/types';

interface Props {
  contexts: VisualContextItem[];
  active: boolean;
}

export function VisualContextIndicator({ contexts, active }: Props) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-white/80">
        <span>Visual context feed</span>
        <span className={`text-xs uppercase tracking-wide ${active ? 'text-emerald-400' : 'text-white/40'}`}>
          {active ? 'Active' : 'Paused'}
        </span>
      </div>
      <div className="flex max-h-48 flex-col gap-2 overflow-y-auto text-sm">
        {contexts.length === 0 ? (
          <p className="text-white/50">Waiting for visual updates…</p>
        ) : (
          contexts.map((context) => (
            <div key={context.capturedAt} className="rounded-xl bg-black/20 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-white/60">
                {new Date(context.capturedAt).toLocaleTimeString()} • {context.source}
              </div>
              <p className="text-white/90">{context.description}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
