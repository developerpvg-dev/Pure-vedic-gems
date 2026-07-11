'use client';

import { Mic, MicOff } from 'lucide-react';

type VoiceButtonProps = {
  active: boolean;
  disabled?: boolean;
  label: string;
  stopLabel: string;
  onToggle: () => void;
};

export function VoiceButton({ active, disabled, label, stopLabel, onToggle }: VoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`rounded-lg p-2 transition ${active ? 'bg-red-500/20 text-red-200' : 'hover:bg-white/10 text-white'}`}
      aria-label={active ? stopLabel : label}
    >
      {active ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
