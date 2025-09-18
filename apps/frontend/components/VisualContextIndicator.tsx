'use client';

type VisualContextIndicatorProps = {
  active: boolean;
  contexts: { description: string; capturedAt: number; source: 'screen' | 'camera' }[];
};

const VisualContextIndicator = ({ active, contexts }: VisualContextIndicatorProps) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="font-medium uppercase tracking-widest text-slate-400">Visual Context</span>
        <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
      </div>
      <div className="mt-3 space-y-2 text-xs text-slate-300">
        {contexts.length === 0 && <p className="text-slate-500">Waiting for visual observations.</p>}
        {contexts.map((ctx) => (
          <div key={`${ctx.source}-${ctx.capturedAt}`} className="rounded-lg bg-slate-800/60 p-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
              <span>{ctx.source}</span>
              <span>{new Date(ctx.capturedAt).toLocaleTimeString()}</span>
            </div>
            <p className="mt-1 text-xs text-slate-200">{ctx.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualContextIndicator;
