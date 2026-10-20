// ontabs-play/components/HUD.tsx
import { GameStats } from '../types';

interface HUDProps {
  title: string;
  artist: string;
  difficulty: string;
  bpm: number;
  stats: GameStats;
  provenance?: 'USER_EXTRACTED' | 'SYNTHETIC_DEMO';
}

export function HUD({ title, artist, difficulty, bpm, stats, provenance }: HUDProps) {
  return (
    <div className="otp-hud">
      <div className="otp-hud-song">
        <strong>{title}</strong>
        <span>{artist}</span>
      </div>
      <div className="otp-hud-meta">
        <span className="otp-pill">{difficulty}</span>
        <span className="otp-pill">{bpm} BPM</span>
        {provenance === 'SYNTHETIC_DEMO' ? (
          <span className="otp-pill" style={{ background: 'rgba(255, 209, 102, 0.2)', color: '#ffd166', border: '1px solid #ffd166' }}>
            Demo Sintética
          </span>
        ) : (
          <span className="otp-pill" style={{ background: 'rgba(61, 220, 151, 0.2)', color: '#3ddc97', border: '1px solid #3ddc97' }}>
            Áudio Real Extraído
          </span>
        )}
      </div>
      <div className="otp-hud-combo">
        <span className="otp-combo-number">{stats.combo}</span>
        <span className="otp-combo-label">combo</span>
        <span className="otp-multiplier">x{stats.multiplier}</span>
      </div>
      <div className="otp-hud-score">
        <div>
          <span className="otp-score-number">{stats.score.toLocaleString('pt-BR')}</span>
          <span className="otp-score-label">score</span>
        </div>
        <div>
          <span className="otp-score-number">{stats.accuracy}%</span>
          <span className="otp-score-label">accuracy</span>
        </div>
      </div>
    </div>
  );
}
