'use client';

import { Button } from '../../components/ui/button';
import type { CaptureMode } from '../lib/types';

const modes: CaptureMode[] = ['screen', 'camera', 'hybrid'];

interface Props {
  current: CaptureMode;
  onChange: (mode: CaptureMode) => void;
}

export function ModeSelector({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {modes.map((mode) => (
        <Button
          key={mode}
          type="button"
          variant={current === mode ? 'primary' : 'secondary'}
          onClick={() => onChange(mode)}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </Button>
      ))}
    </div>
  );
}
