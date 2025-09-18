'use client';

import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-2xl border border-white/10 bg-surface/60 p-6 backdrop-blur', className)} {...props} />;
}
