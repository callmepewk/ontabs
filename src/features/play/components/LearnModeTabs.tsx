// ontabs-play/components/LearnModeTabs.tsx
import { LearnMode } from '../types';

interface LearnModeTabsProps {
  mode: LearnMode;
  onChange: (mode: LearnMode) => void;
}

const MODES: { key: LearnMode; label: string }[] = [
  { key: 'game', label: 'Game' },
  { key: 'tab', label: 'Tab' },
  { key: 'chords', label: 'Acordes' },
  { key: 'rhythm', label: 'Ritmo' },
];

export function LearnModeTabs({ mode, onChange }: LearnModeTabsProps) {
  return (
    <div className="otp-learn-tabs">
      {MODES.map((m) => (
        <button
          key={m.key}
          className={`otp-learn-tab ${mode === m.key ? 'active' : ''}`}
          onClick={() => onChange(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
