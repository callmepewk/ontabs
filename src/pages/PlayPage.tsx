// src/pages/PlayPage.tsx
// OnTabs Play — Experiência Rítmica Soberana com Separação Estrita de Modos:
// Modo 1: Sessão com Áudio Real e Chart Extraída (rastreabilidade integral)
// Modo 2: Demonstração Sintética Calibrada via Web Audio (claramente rotulada)

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayScreen } from '@/features/play/PlayScreen';
import { generateGameChart } from '@/features/play/chartGenerator';
import { GameChart, TabEvent } from '@/features/play/types';
import { musicService, PaginatedSongs } from '@/services/musicService';
import { tabService } from '@/services/tabService';
import { Song } from '@/types/domain';

function toPlayDifficulty(d?: string): 'easy' | 'medium' | 'hard' | 'expert' {
  if (d === 'beginner' || d === 'easy') return 'easy';
  if (d === 'intermediate' || d === 'medium') return 'medium';
  if (d === 'advanced' || d === 'hard') return 'hard';
  if (d === 'expert') return 'expert';
  return 'medium';
}

// Eventos da demonstração sintética do Canon Rock (claramente rotulados)
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
  const [librarySongs, setLibrarySongs] = useState<Song[]>([]);
  const [emptyExtractionReason, setEmptyExtractionReason] = useState<string | null>(null);

  useEffect(() => {
    // Carrega músicas da biblioteca para permitir seleção imediata de faixas reais
    musicService.listLibrary(1, 6).then((res: PaginatedSongs) => {
      setLibrarySongs(res.items);
    }).catch(() => null);
  }, []);

  useEffect(() => {
    if (!songId) {
      setLoading(false);
      setEmptyExtractionReason(null);
      return;
    }
    (async () => {
      try {
        const s = await musicService.getSong(songId);
        setSong(s);
        if (s?.tabId) {
          const tab = await tabService.get(s.tabId);
          if (tab) {
            if (!tab.notes || tab.notes.length === 0) {
              setEmptyExtractionReason('A tablatura desta música não possui notas extraídas (áudio silencioso ou sem conteúdo melódico). Nenhuma chart de jogo pôde ser fabricada.');
              setLoading(false);
              return;
            }

            const realChart = generateGameChart(tab.notes, {
              songId: tab.id,
              title: tab.title,
              artist: tab.artist,
              bpm: tab.bpm || 120,
              laneCount: 5,
              difficulty: toPlayDifficulty(tab.difficulty),
              durationSeconds: tab.durationSeconds || 60,
              provenance: 'USER_EXTRACTED',
            });
            setChart(realChart);
          } else {
            setEmptyExtractionReason('Tablatura associada não foi encontrada no servidor.');
          }
        } else {
          setEmptyExtractionReason('Música ainda não possui tablatura processada associada.');
        }
      } catch (err: any) {
        setEmptyExtractionReason(err?.message || 'Erro ao carregar dados da faixa.');
      } finally {
        setLoading(false);
      }
    })();
  }, [songId]);

  const startDemoSong = (difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium') => {
    const demoChart = generateGameChart(CANON_DEMO_TAB_EVENTS, {
      songId: 'demo_canon_play',
      title: 'Canon Rock Theme',
      artist: 'JerryC / Pachelbel',
      bpm: 130,
      laneCount: 5,
      difficulty,
      durationSeconds: 16,
      provenance: 'SYNTHETIC_DEMO',
    });
    setSong({
      id: 'demo_canon_play',
      title: 'Canon Rock Theme (Demo Sintética)',
      artist: 'JerryC / Pachelbel',
      durationSeconds: 16,
      audioUrl: 'synthetic',
      status: 'ready',
    });
    setChart(demoChart);
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p className="page-subtitle">Carregando faixa e gerando chart de execução...</p>
      </div>
    );
  }

  // Estado honesto de falha na extração de notas (zero notas fabricadas)
  if (emptyExtractionReason) {
    return (
      <div className="page" style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <div className="card" style={{ padding: 32, border: '1px solid #ffd166', background: 'rgba(255, 209, 102, 0.05)', borderRadius: 12 }}>
          <span style={{ fontSize: 44 }}>⚠️</span>
          <h2 style={{ fontSize: 20, margin: '16px 0 8px', color: '#ffd166' }}>Sem Notas Extraídas</h2>
          <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6 }}>{emptyExtractionReason}</p>
          <p style={{ color: '#777', fontSize: 13, marginTop: 8 }}>
            Para preservar a integridade científica do OnTabs, <strong>não fabricamos notas sintéticas</strong> quando a extração acústica não detecta eventos reais.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => navigate('/library')}>Voltar à Biblioteca</button>
            <button className="btn btn-primary" onClick={() => navigate('/converter')}>Converter Novo Arquivo</button>
          </div>
        </div>
      </div>
    );
  }

  // Se já temos a música e o chart prontos para jogar
  const effectiveAudioUrl = song?.audioUrl || 'synthetic';
  if (song && chart) {
    return (
      <PlayScreen
        chart={chart}
        audioUrl={effectiveAudioUrl}
        onExit={() => {
          setSong(null);
          setChart(null);
          navigate('/play');
        }}
      />
    );
  }

  // Tela principal do OnTabs Play com os 2 Modos Claramente Separados
  return (
    <div className="page" style={{ maxWidth: 880, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 32 }}>🎸</span>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>OnTabs Play</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Highway rítmica sincronizada com Web Audio, suporte a Gamepad e janelas milimétricas de julgamento.
          </p>
        </div>
      </div>

      {/* MODO 1: Áudio Real Selecionado pelo Usuário */}
      <div className="card" style={{ marginTop: 24, padding: 24, background: 'var(--surface-color, #1a1a1f)', border: '1px solid var(--border-color, #333)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0, color: 'var(--primary-color, #3ddc97)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🎵</span> Modo 1: Sessão com Áudio Real (Suas Músicas)
          </h2>
          <span className="otp-pill" style={{ background: 'rgba(61, 220, 151, 0.15)', color: '#3ddc97', border: '1px solid #3ddc97', fontSize: 11 }}>
            Chart Derivada da Análise Acústica
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, margin: '0 0 16px 0' }}>
          Jogue tablaturas geradas a partir de gravações reais. Cada nota que desce no highway corresponde a um evento musical detectado pelo motor ou ajustado no editor.
        </p>

        {librarySongs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {librarySongs.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {s.artist} {s.bpm ? `• ${s.bpm} BPM` : ''}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                  onClick={() => navigate(`/play/${s.id}`)}
                >
                  ▶ Jogar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: 13, margin: '0 0 12px 0' }}>
              Nenhuma música processada encontrada na sua biblioteca local.
            </p>
            <button className="btn" onClick={() => navigate('/converter')}>
              Converter Primeiro Arquivo
            </button>
          </div>
        )}
      </div>

      {/* MODO 2: Demonstração Sintética Calibrada */}
      <div className="card" style={{ marginTop: 20, padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px dashed #ffd166', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0, color: '#ffd166', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚙️</span> Modo 2: Demonstração Sintética Calibrada
          </h2>
          <span className="otp-pill" style={{ background: 'rgba(255, 209, 102, 0.15)', color: '#ffd166', border: '1px solid #ffd166', fontSize: 11 }}>
            Web Audio Sintetizado
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, margin: '0 0 16px 0' }}>
          Demonstração de precisão milimétrica de timing com síntese harmônica em tempo real (Canon em Ré). Ideal para testar latência de áudio, precisão de inputs e suporte a Gamepad sem depender de arquivos externos.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <button
            className="btn"
            style={{ padding: '12px 16px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: '#ffd166', color: '#000' }}
            onClick={() => startDemoSong('medium')}
          >
            <span>▶ Jogar Canon Rock (Médio)</span>
            <small style={{ opacity: 0.8, fontSize: 11 }}>Densidade Moderada • 130 BPM</small>
          </button>

          <button
            className="btn"
            style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            onClick={() => startDemoSong('expert')}
          >
            <span>🔥 Modo Expert</span>
            <small style={{ opacity: 0.8, fontSize: 11 }}>Acordes Completos e 100% das Notas</small>
          </button>

          <button
            className="btn"
            style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            onClick={() => startDemoSong('easy')}
          >
            <span>🌱 Modo Iniciante</span>
            <small style={{ opacity: 0.8, fontSize: 11 }}>Linhas Uníssonas Espaçadas</small>
          </button>
        </div>
      </div>
    </div>
  );
}
