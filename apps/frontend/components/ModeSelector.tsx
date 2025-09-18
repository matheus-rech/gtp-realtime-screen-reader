'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import type { AssistantMode } from '@/types/realtime';

const modeLabels: Record<AssistantMode, string> = {
  screen: 'Screen',
  camera: 'Camera',
  hybrid: 'Hybrid'
};

type ModeSelectorProps = {
  mode: AssistantMode;
  onChange: (mode: AssistantMode) => void;
};

const ModeSelector = ({ mode, onChange }: ModeSelectorProps) => (
  <div>
    <Listbox value={mode} onChange={onChange}>
      <div className="relative mt-1">
        <Listbox.Button className="relative w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900/70 py-2 pl-3 pr-10 text-left text-sm text-slate-100 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
          <span className="block truncate">Mode: {modeLabels[mode]}</span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 py-1 text-sm shadow-lg focus:outline-none">
            {Object.entries(modeLabels).map(([value, label]) => (
              <Listbox.Option
                key={value}
                value={value as AssistantMode}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-3 pr-4 ${
                    active ? 'bg-primary/30 text-white' : 'text-slate-200'
                  }`
                }
              >
                {label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  </div>
);

export default ModeSelector;
