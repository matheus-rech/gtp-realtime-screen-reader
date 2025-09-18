'use client';

import { StopIcon } from '@radix-ui/react-icons';
import { Button } from '../../components/ui/button';

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export function InterruptButton({ onClick, disabled }: Props) {
  return (
    <Button type="button" variant="ghost" onClick={onClick} disabled={disabled} className="gap-2 text-rose-300">
      <StopIcon />
      Interrupt
    </Button>
  );
}
