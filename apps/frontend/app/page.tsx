import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const AssistantApp = dynamic(() => import('./(components)/assistant-app').then((mod) => ({ default: mod.AssistantApp })), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-background text-white">
      <p className="text-white/60">Loading realtime assistant…</p>
    </main>
  )
});

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <AssistantApp />
    </Suspense>
  );
}
