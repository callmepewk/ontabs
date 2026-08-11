// ontabs-play/components/TrainingPanel.tsx
import { useState } from 'react';
import { AudioEngine } from '../audioEngine';

interface TrainingPanelProps {
  audio: AudioEngine;
  durationSeconds: number;
}

const SPEEDS = [0.5, 0.75, 1, 1.25];

export function TrainingPanel({ audio, durationSeconds }: TrainingPanelProps) {
  const [active, setActive] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(Math.min(8, durationSeconds));
  const [speed, setSpeed] = useState(1);

  const toggleTraining = () => {
    if (active) {
      audio.clearLoopRegion();
      audio.setPlaybackRate(1);
      setSpeed(1);
    } else {
      audio.setLoopRegion(loopStart, loopEnd);
    }
    setActive(!active);
  };

  const applySpeed = (s: number) => {
    setSpeed(s);
    audio.setPlaybackRate(s);
  };

  return (
    <div className="otp-training-panel">
      <button className={`otp-train-toggle ${active ? 'active' : ''}`} onClick={toggleTraining}>
        {active ? 'Sair do treino' : 'Treinar trecho'}
      </button>

      {active && (
        <>
          <div className="otp-loop-range">
            <label>
              Início
              <input
                type="range" min={0} max={durationSeconds} step={0.5} value={loopStart}
                onChange={(e) => { const v = Number(e.target.value); setLoopStart(v); audio.setLoopRegion(v, loopEnd); }}
              />
            </label>
            <label>
              Fim
              <input
                type="range" min={0} max={durationSeconds} step={0.5} value={loopEnd}
                onChange={(e) => { const v = Number(e.target.value); setLoopEnd(v); audio.setLoopRegion(loopStart, v); }}
              />
            </label>
          </div>

          <div className="otp-speed-row">
            {SPEEDS.map((s) => (
              <button key={s} className={`otp-speed-btn ${speed === s ? 'active' : ''}`} onClick={() => applySpeed(s)}>
                {Math.round(s * 100)}%
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
