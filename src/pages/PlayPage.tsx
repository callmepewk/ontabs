// src/pages/PlayPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayScreen } from '@/features/play/PlayScreen';
import { generateGameChart } from '@/features/play/chartGenerator';
import { GameChart } from '@/features/play/types';
import { musicService } from '@/services/musicService';
import { tabService } from '@/services/tabService';
import { Song } from '@/types/domain';

export function PlayPage() {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [chart, setChart] = useState<GameChart | null>(null);
  const [loading, setLoading] = useState(Boolean(songId));

  useEffect(() => {
    if (!songId) { setLoading(false); return; }
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
              difficulty: tab.difficulty,
              durationSeconds: tab.durationSeconds,
            })
          );
        }
      }
      setLoading(false);
    })();
  }, [songId]);

  if (loading) {
    return <div className="page"><p className="page-subtitle">Carregando...</p></div>;
  }

  // Estado honesto: sem música pronta com áudio + tab processados, não há
  // o que jogar ainda. Não inventamos um chart fake pra preencher a tela.
  if (!song || !chart || !song.audioUrl) {
    return (
      <div className="page">
        <h1 className="page-title">OnTabs Play</h1>
        <div className="empty-state card">
          <p>Nenhuma música pronta para jogar ainda.</p>
          <p style={{ fontSize: 13 }}>Converta uma música na aba Converter para gerar uma tablatura jogável aqui.</p>
          <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/converter')}>
            Ir para Converter
          </button>
        </div>
      </div>
    );
  }

  return <PlayScreen chart={chart} audioUrl={song.audioUrl} onExit={() => navigate('/library')} />;
}
