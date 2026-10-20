// src/pages/PlayPage.tsx
// OnTabs Play — Experiência Rítmica Soberana com Suporte a Demonstrações Públicas

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayScreen } from '@/features/play/PlayScreen';
import { generateGameChart } from '@/features/play/chartGenerator';
import { GameChart, TabEvent } from '@/features/play/types';
import { musicService } from '@/services/musicService';
import { tabService } from '@/services/tabService';
import { Song } from '@/types/domain';

function toPlayDifficulty(d?: string): 'easy' | 'medium' | 'hard' | 'expert' {
  if (d === 'beginner' || d === 'easy') return 'easy';
  if (d === 'intermediate' || d === 'medium') return 'medium';
  if (d === 'advanced' || d === 'hard') return 'hard';
  if (d === 'expert') return 'expert';
  return 'medium';
}

const CANON_DEMO_TAB_EVENTS: TabEvent[] = [
  { timestamp: 1.0, strings: [1] },
  { timestamp: 1.5, strings: [2] },
  { timestamp: 2.0, strings: [3] },
  { timestamp: 2.5, strings: [2] },
  { timestamp: 3.0, strings: [1] },
  { timestamp: 3.5, strings: [4] },
  { timestamp: 4.0, strings: [1, 2] },
  { timestamp: 4.5, strings: [3] },
  { timestamp: 5.0, strings: [2] },
  { timestamp: 5.5, strings: [1] },
  { timestamp: 6.0, strings: [3] },
  { timestamp: 6.5, strings: [2] },
  { timestamp: 7.0, strings: [1, 3] },
  { timestamp: 7.5, strings: [2] },
  { timestamp: 8.0, strings: [1] },
  { timestamp: 8.5, strings: [4] },
  { timestamp: 9.0, strings: [2] },
  { timestamp: 9.5, strings: [3] },
  { timestamp: 10.0, strings: [1] },
  { timestamp: 10.5, strings: [2] },
  { timestamp: 11.0, strings: [3] },
  { timestamp: 11.5, strings: [2] },
  { timestamp: 12.0, strings: [1] },
  { timestamp: 12.5, strings: [4] },
  { timestamp: 13.0, strings: [1, 2] },
  { timestamp: 14.0, strings: [1, 3], sustainMs: 1500 },
];

export function PlayPage() {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [chart, setChart] = useState<GameChart | null>(null);
  const [loading, setLoading] = useState(Boolean(songId));

  useEffect(() => {
    if (!songId) {
      setLoading(false);
      return;
    }
    (async () => {
      const s = await musicService.getSong(songId);
      setSong(s);
      if (s?.tabId) {
        const tab = await tabService.get(s.tabId);
        if (tab) {
          setChart(
            generateGameChart(tab.notes, {
              songId: tab.id,
              title: tab.title,
              artist: tab.artist,
              bpm: tab.bpm,
              laneCount: 5,
              difficulty: toPlayDifficulty(tab.difficulty),
              durationSeconds: tab.durationSeconds,
            })
          );
        }
      }
      setLoading(false);
    })();
  }, [songId]);

  const startDemoSong = (difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium') => {
    const demoChart = generateGameChart(CANON_DEMO_TAB_EVENTS, {
      songId: 'demo_canon_play',
      title: 'Canon Rock Theme (Demonstração Web Audio)',
      artist: 'JerryC / Pachelbel',
      bpm: 130,
      laneCount: 5,
      difficulty,
      durationSeconds: 16,
    });
    setSong({
      id: 'demo_canon_play',
      title: 'Canon Rock Theme',
      artist: 'JerryC / Pachelbel',
      durationSeconds: 16,
      audioUrl: 'synthetic',
      status: 'ready',
    });
    setChart(demoChart);
  };

  if (loading) {
    return (
      <div className="page">
        <p className="page-subtitle">Carregando faixa...</p>
      </div>
    );
  }

  // Se já temos a música e o chart prontos para jogar
  if (song && chart && song.audioUrl) {
    return (
      <PlayScreen
        chart={chart}
        audioUrl={song.audioUrl}
        onExit={() => {
          setSong(null);
          setChart(null);
          navigate('/play');
        }}
      />
    );
  }

  // Estado interativo para visitantes: seleção imediata de demonstração jogável ou redirecionamento para conversão
  return (
    <div className="page" style={{ maxWidth: 840, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 32 }}>🎸</span>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>OnTabs Play</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Highway rítmica sincronizada com Web Audio, suporte a Gamepad e janelas milimétricas de julgamento.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24, padding: 24, background: 'var(--surface-color, #1a1a1f)', border: '1px solid var(--border-color, #333)', borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 12, color: 'var(--primary-color, #3ddc97)' }}>
          🎮 Demonstração Interativa Imediata
        </h2>
        <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6 }}>
          Experimente o motor rítmico do OnTabs Play diretamente no navegador. O áudio harmônico é sintetizado em tempo real via Web Audio API, sem necessidade de carregar arquivos externos.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
          <button
            className="btn btn-primary"
            style={{ padding: '12px 16px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            onClick={() => startDemoSong('medium')}
          >
            <span>▶ Jogar Canon Rock</span>
            <small style={{ opacity: 0.8, fontSize: 11 }}>Dificuldade Média • 130 BPM</small>
          </button>

          <button
            className="btn"
            style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            onClick={() => startDemoSong('expert')}
          >
            <span>🔥 Modo Expert</span>
            <small style={{ opacity: 0.8, fontSize: 11 }}>Acordes e Densidade Máxima</small>
          </button>

          <button
            className="btn"
            style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            onClick={() => startDemoSong('easy')}
          >
            <span>🌱 Modo Iniciante</span>
            <small style={{ opacity: 0.8, fontSize: 11 }}>Linhas Melódicas Uníssonas</small>
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20, padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px dashed #444', borderRadius: 12 }}>
        <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 8 }}>Ou jogue suas próprias tablaturas</h3>
        <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.5 }}>
          Ao converter qualquer arquivo de áudio (MP3, WAV, FLAC) na aba Converter ou explorar a Biblioteca, você pode abrir o modo Play diretamente a partir da tablatura gerada.
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <button className="btn" onClick={() => navigate('/library')}>
            Explorar Biblioteca
          </button>
          <button className="btn" onClick={() => navigate('/converter')}>
            Converter Nova Faixa
          </button>
        </div>
      </div>
    </div>
  );
}
