'use client';

import { DotFilledIcon } from '@radix-ui/react-icons';
import type { ConnectionState } from '../lib/types';

interface Props {
  status: ConnectionState;
}

const statusColors: Record<ConnectionState, string> = {
  idle: 'text-white/40',
  connecting: 'text-amber-400',
  connected: 'text-emerald-400',
  error: 'text-rose-400'
};

export function ConnectionStatus({ status }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <DotFilledIcon className={statusColors[status]} />
      <span className="capitalize text-white/70">{status}</span>
    </div>
  );
}
