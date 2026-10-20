// ontabs-play/PlayScreen.tsx
//
// Tela fullscreen /play. Ponto de entrada do módulo OnTabs Play.
//
// Integração esperada no seu roteador (Next.js / React Router — ajuste ao seu OnTabs):
//   <Route path="/play/:songId" element={<PlayScreen songId={...} />} />
//
// Este componente assume que `chart` e `audioUrl` já vieram prontos de cima
// (ex: de uma query ao backend do OnTabs que roda generateGameChart nos
// dados reais da tab). Ele NÃO inventa dados de música.

import { useEffect, useMemo, useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { DEFAULT_KEY_BINDINGS } from './gamepadManager';
import { Highway } from './components/Highway';
import { HUD } from './components/HUD';
import { GamepadPanel } from './components/GamepadPanel';
import { TouchControls } from './components/TouchControls';
import { TrainingPanel } from './components/TrainingPanel';
import { LearnModeTabs } from './components/LearnModeTabs';
import { DifficultySelector } from './components/DifficultySelector';
import { ResultsScreen } from './components/ResultsScreen';
import { ProgressService } from './progressStore';
import { GameChart, Difficulty, LearnMode, KeyBindings } from './types';
import './play.css';

const LANE_COLORS = ['#3ddc97', '#ff5e6c', '#ffd166', '#4d8dff', '#ff8f3f', '#c77dff'];

interface PlayScreenProps {
  chart: GameChart;
  audioUrl: string;
  onDifficultyChange?: (d: Difficulty) => void;
  onExit?: () => void;
}

export function PlayScreen({ chart, audioUrl, onDifficultyChange, onExit }: PlayScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(chart.difficulty);
  const [learnMode, setLearnMode] = useState<LearnMode>('game');
  const [bindings, setBindings] = useState<KeyBindings>(DEFAULT_KEY_BINDINGS);
  const [isTouch, setIsTouch] = useState(false);
  const [started, setStarted] = useState(false);
  const [bestAccuracy, setBestAccuracy] = useState(0);

  const progress = useMemo(() => new ProgressService(), []);
  const { ready, stats, ended, engine, audio, gamepadManager, input, playFromStart } = useGameEngine({
    chart,
    audioUrl,
    bindings,
  });

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    progress.get(chart.songId, difficulty).then((r) => setBestAccuracy(r?.bestAccuracy ?? 0));
  }, [chart.songId, difficulty, progress]);

  // salva tempo praticado periodicamente
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      progress.addPracticeTime(chart.songId, difficulty, 5);
    }, 5000);
    return () => clearInterval(id);
  }, [started, chart.songId, difficulty, progress]);

  useEffect(() => {
    if (ended && stats) {
      const completed = stats.miss === 0 && stats.judged === stats.totalNotes;
      progress.recordRun(chart.songId, difficulty, stats, completed);
    }
  }, [ended, stats, chart.songId, difficulty, progress]);

  function handleStart() {
    setStarted(true);
    playFromStart();
  }

  const displayStats = stats ?? {
    score: 0, combo: 0, maxCombo: 0, multiplier: 1 as const,
    totalNotes: chart.notes.length, judged: 0, perfect: 0, great: 0, good: 0, miss: 0, accuracy: 100,
  };

  return (
    <div className="otp-root">
      {!started && (
        <div className="otp-pregame">
          <h1>OnTabs Play</h1>
          <h2>{chart.title} <span>· {chart.artist}</span></h2>
          <div style={{ marginTop: 6, marginBottom: 12 }}>
            {chart.provenance === 'SYNTHETIC_DEMO' ? (
              <span className="otp-pill" style={{ background: 'rgba(255, 209, 102, 0.2)', color: '#ffd166', border: '1px solid #ffd166', fontSize: 12 }}>
                ⚙️ Demonstração Sintética (Web Audio)
              </span>
            ) : (
              <span className="otp-pill" style={{ background: 'rgba(61, 220, 151, 0.2)', color: '#3ddc97', border: '1px solid #3ddc97', fontSize: 12 }}>
                🎵 Áudio Real Extraído ({chart.notes.length} notas na chart)
              </span>
            )}
          </div>

          <DifficultySelector
            value={difficulty}
            onChange={(d) => { setDifficulty(d); onDifficultyChange?.(d); }}
            bestByDifficulty={{ [difficulty]: { accuracy: bestAccuracy, completed: false } }}
          />

          {gamepadManager && (
            <GamepadPanel gamepadManager={gamepadManager} bindings={bindings} onRemap={setBindings} />
          )}

          <button className="otp-start-btn" disabled={!ready} onClick={handleStart}>
            {ready ? 'Começar' : 'Carregando áudio...'}
          </button>
        </div>
      )}

      {started && learnMode === 'game' && (
        <>
          <HUD
            title={chart.title}
            artist={chart.artist}
            difficulty={difficulty}
            bpm={chart.bpm}
            stats={displayStats}
            provenance={chart.provenance}
          />
          <Highway engine={engine} laneCount={chart.laneCount} laneColors={LANE_COLORS} />
          {isTouch && input && (
            <TouchControls laneCount={chart.laneCount} laneColors={LANE_COLORS} input={input} />
          )}
          {audio && <TrainingPanel audio={audio} durationSeconds={chart.durationSeconds} />}
        </>
      )}

      {started && learnMode !== 'game' && (
        <div className="otp-learn-panel">
          <p>Modo "{learnMode}" reutiliza os componentes de visualização de tab já existentes no OnTabs
          (o mesmo chart continua tocando por baixo — só a visualização muda).</p>
        </div>
      )}

      {started && (
        <LearnModeTabs mode={learnMode} onChange={setLearnMode} />
      )}

      {ended && stats && (
        <ResultsScreen
          stats={stats}
          isNewBest={stats.accuracy > bestAccuracy}
          onRetry={handleStart}
          onExit={() => onExit?.()}
        />
      )}
    </div>
  );
}
