// ontabs-play/components/ResultsScreen.tsx
import { GameStats } from '../types';

interface ResultsScreenProps {
  stats: GameStats;
  isNewBest: boolean;
  onRetry: () => void;
  onExit: () => void;
}

export function ResultsScreen({ stats, isNewBest, onRetry, onExit }: ResultsScreenProps) {
  return (
    <div className="otp-results">
      <h2>{isNewBest ? 'Novo recorde!' : 'Resultado'}</h2>
      <div className="otp-results-grid">
        <div><span>{stats.score.toLocaleString('pt-BR')}</span><label>Score</label></div>
        <div><span>{stats.accuracy}%</span><label>Accuracy</label></div>
        <div><span>{stats.maxCombo}</span><label>Maior combo</label></div>
        <div><span>{stats.perfect}</span><label>Perfect</label></div>
        <div><span>{stats.great}</span><label>Great</label></div>
        <div><span>{stats.good}</span><label>Good</label></div>
        <div><span>{stats.miss}</span><label>Miss</label></div>
      </div>
      <div className="otp-results-actions">
        <button onClick={onRetry}>Tentar novamente</button>
        <button className="secondary" onClick={onExit}>Sair</button>
      </div>
    </div>
  );
}
