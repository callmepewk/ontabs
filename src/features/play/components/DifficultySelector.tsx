// ontabs-play/components/DifficultySelector.tsx
import { Difficulty } from '../types';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  bestByDifficulty?: Partial<Record<Difficulty, { accuracy: number; completed: boolean }>>;
}

const OPTIONS: { key: Difficulty; label: string; desc: string }[] = [
  { key: 'easy', label: 'Easy', desc: 'Poucas notas, ritmo simples' },
  { key: 'medium', label: 'Medium', desc: 'Mais notas, acordes' },
  { key: 'hard', label: 'Hard', desc: 'Mais velocidade, variações' },
  { key: 'expert', label: 'Expert', desc: 'Máxima fidelidade à execução real' },
];

export function DifficultySelector({ value, onChange, bestByDifficulty }: DifficultySelectorProps) {
  return (
    <div className="otp-difficulty-selector">
      {OPTIONS.map((opt) => {
        const best = bestByDifficulty?.[opt.key];
        return (
          <button
            key={opt.key}
            className={`otp-difficulty-card ${value === opt.key ? 'active' : ''}`}
            onClick={() => onChange(opt.key)}
          >
            <strong>{opt.label}</strong>
            <span>{opt.desc}</span>
            {best && (
              <span className="otp-difficulty-best">
                {best.completed ? '✓ concluída · ' : ''}{best.accuracy}% acc
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
