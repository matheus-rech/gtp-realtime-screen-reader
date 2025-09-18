'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-indigo-500 focus-visible:outline-accent',
        secondary: 'bg-surface text-white hover:bg-slate-800 focus-visible:outline-white',
        ghost: 'bg-transparent hover:bg-slate-800/50'
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={clsx(buttonVariants({ variant }), className)} {...props} />;
}
