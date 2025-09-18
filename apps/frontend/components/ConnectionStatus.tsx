'use client';

import type { ConnectionState } from '@/types/realtime';

type ConnectionStatusProps = {
  state: ConnectionState;
  latencyMs: number | null;
};

const colors: Record<ConnectionState, string> = {
  connected: 'text-emerald-400',
  connecting: 'text-amber-400',
  disconnected: 'text-rose-400',
  error: 'text-rose-400'
};

const ConnectionStatus = ({ state, latencyMs }: ConnectionStatusProps) => (
  <div className={`text-xs uppercase tracking-widest ${colors[state]}`}>
    {state} {latencyMs ? `• ${latencyMs.toFixed(0)}ms` : ''}
  </div>
);

export default ConnectionStatus;
