// src/components/ArrangementMapViewer.tsx
// Visualizador de Arranjo Coletivo & Inteligência de Duas Guitarras (Annex 001)

import React, { useState } from 'react';
import { PartRelationship } from '@/types/domain';

export interface ArrangementTrack {
  id: string;
  name: string;
  instrument: string;
  role: 'lead' | 'rhythm' | 'bass' | 'harmony' | 'drum_grid';
  color: string;
  isMuted: boolean;
  isSolo: boolean;
}

interface SectionMarker {
  name: string;
  startTime: number;
  endTime: number;
  relationship: PartRelationship;
  relationshipDetail: string;
}

interface ArrangementMapViewerProps {
  durationSeconds: number;
}

export const ArrangementMapViewer: React.FC<ArrangementMapViewerProps> = ({
  durationSeconds,
}) => {
  const [tracks, setTracks] = useState<ArrangementTrack[]>([
    { id: 'trk_lead', name: 'Guitarra Solo (Lead)', instrument: 'lead_guitar', role: 'lead', color: '#10b981', isMuted: false, isSolo: false },
    { id: 'trk_rhythm', name: 'Guitarra Base (Rhythm)', instrument: 'rhythm_guitar', role: 'rhythm', color: '#3b82f6', isMuted: false, isSolo: false },
    { id: 'trk_bass', name: 'Contrabaixo', instrument: 'bass', role: 'bass', color: '#f59e0b', isMuted: false, isSolo: false },
    { id: 'trk_drums', name: 'Bateria (Groove Grid)', instrument: 'drums', role: 'drum_grid', color: '#ec4899', isMuted: false, isSolo: false },
  ]);

  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(1);

  const sections: SectionMarker[] = [
    { name: 'Intro', startTime: 0, endTime: Math.max(15, durationSeconds * 0.15), relationship: 'INDEPENDENT_LINES', relationshipDetail: 'Riff principal de abertura vs base sustentada' },
    { name: 'Verso 1', startTime: Math.max(15, durationSeconds * 0.15), endTime: Math.max(45, durationSeconds * 0.45), relationship: 'RHYTHMIC_COMPLEMENT', relationshipDetail: 'Base sincopada com arpejos esparsos de apoio' },
    { name: 'Refrão', startTime: Math.max(45, durationSeconds * 0.45), endTime: Math.max(80, durationSeconds * 0.75), relationship: 'HARMONIZED', relationshipDetail: 'Harmonização a terças paralelas entre Guitarras 1 e 2' },
    { name: 'Solo', startTime: Math.max(80, durationSeconds * 0.75), endTime: Math.max(105, durationSeconds * 0.9), relationship: 'HARMONIC_SUPPORT', relationshipDetail: 'Solo melódico virtuoso sobre progressão pesada de powerchords' },
    { name: 'Outro', startTime: Math.max(105, durationSeconds * 0.9), endTime: durationSeconds || 120, relationship: 'UNISON', relationshipDetail: 'Finalização em uníssono rítmico e melódico da banda' },
  ];

  function toggleMute(trackId: string) {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t)));
  }

  function toggleSolo(trackId: string) {
    setTracks(tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, isSolo: !t.isSolo, isMuted: false };
      }
      return t;
    }));
  }

  const activeSection = sections[activeSectionIdx] || sections[0];

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20, background: '#0e0f17', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🗺️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Mapa de Arranjo & Inteligência de Duas Guitarras</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Detecção de papéis entre Guitarras Solo/Base e relações polifônicas da banda
            </span>
          </div>
        </div>

        <div style={{
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 12,
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          fontWeight: 600,
        }}>
          Relação Atual: {activeSection.relationship}
        </div>
      </div>

      {/* Linha do Tempo das Seções Musicais */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {sections.map((sec, idx) => (
          <button
            key={sec.name}
            onClick={() => setActiveSectionIdx(idx)}
            style={{
              flex: 1,
              minWidth: 90,
              padding: '8px 10px',
              borderRadius: 6,
              border: activeSectionIdx === idx ? '1px solid #10b981' : '1px solid var(--border)',
              background: activeSectionIdx === idx ? 'rgba(16, 185, 129, 0.2)' : '#14151f',
              color: activeSectionIdx === idx ? '#10b981' : 'var(--text)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700 }}>{sec.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {Math.round(sec.startTime)}s - {Math.round(sec.endTime)}s
            </div>
          </button>
        ))}
      </div>

      {/* Descrição da Transição e Interação Polifônica */}
      <div style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: '#0a0a10',
        border: '1px solid var(--border)',
        marginBottom: 16,
        fontSize: 13,
      }}>
        <div style={{ color: '#3ddc97', fontWeight: 600, marginBottom: 2 }}>
          Dinâmica Musical ({activeSection.name}): {activeSection.relationship}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {activeSection.relationshipDetail}
        </div>
      </div>

      {/* Faixas e Controles de Solo / Mudo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tracks.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 6,
              background: t.isMuted ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
              borderLeft: `4px solid ${t.color}`,
              opacity: t.isMuted ? 0.45 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                {t.role}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn secondary"
                onClick={() => toggleSolo(t.id)}
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  background: t.isSolo ? '#ffd166' : 'transparent',
                  color: t.isSolo ? '#000' : 'var(--text)',
                  fontWeight: t.isSolo ? 700 : 400,
                }}
              >
                SOLO
              </button>
              <button
                className="btn secondary"
                onClick={() => toggleMute(t.id)}
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  background: t.isMuted ? '#ef4444' : 'transparent',
                  color: t.isMuted ? '#fff' : 'var(--text)',
                  fontWeight: t.isMuted ? 700 : 400,
                }}
              >
                MUTE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
