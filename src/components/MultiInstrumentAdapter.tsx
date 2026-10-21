// src/components/MultiInstrumentAdapter.tsx
// OnTabs "Toque do Seu Jeito" — Multi-Instrument Adaptation Panel

import React, { useState } from 'react';
import { Instrument } from '@/types/domain';

interface MultiInstrumentAdapterProps {
  currentInstrument: Instrument;
  currentDifficulty: string;
  onInstrumentChange: (inst: Instrument) => void;
  onDifficultyChange: (diff: 'beginner' | 'intermediate' | 'advanced') => void;
}

export const MultiInstrumentAdapter: React.FC<MultiInstrumentAdapterProps> = ({
  currentInstrument,
  currentDifficulty,
  onInstrumentChange,
  onDifficultyChange,
}) => {
  const [selectedInst, setSelectedInst] = useState<Instrument>(currentInstrument);
  const [selectedDiff, setSelectedDiff] = useState<'beginner' | 'intermediate' | 'advanced'>(
    (currentDifficulty as any) || 'intermediate'
  );
  const [saxTransposition, setSaxTransposition] = useState<'Eb' | 'Bb'>('Eb');

  function handleSelectInstrument(inst: Instrument) {
    setSelectedInst(inst);
    onInstrumentChange(inst);
  }

  function handleSelectDifficulty(diff: 'beginner' | 'intermediate' | 'advanced') {
    setSelectedDiff(diff);
    onDifficultyChange(diff);
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20, background: '#0e0f17', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>🎸</span>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>Toque do Seu Jeito (Multi-Instrumental)</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Adapte arranjo, afinação e dificuldade dinamicamente para o seu instrumento de prática
          </span>
        </div>
      </div>

      {/* Seletor de Instrumentos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'guitar', label: 'Guitarra', icon: '🎸' },
          { id: 'bass', label: 'Contrabaixo', icon: '🎻' },
          { id: 'acoustic_guitar', label: 'Violão Acústico', icon: '🪕' },
          { id: 'drums', label: 'Bateria', icon: '🥁' },
          { id: 'saxophone', label: 'Saxofone', icon: '🎷' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelectInstrument(item.id as Instrument)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: selectedInst === item.id ? '1px solid #10b981' : '1px solid var(--border)',
              background: selectedInst === item.id ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
              color: selectedInst === item.id ? '#10b981' : 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Informações Específicas de Instrumento */}
      {selectedInst === 'bass' && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#f59e0b',
          fontSize: 12,
          marginBottom: 16,
        }}>
          ℹ️ <strong>Adaptação de Contrabaixo:</strong> Notas transpostas 1 oitava abaixo (E1-G3). Linhas melódicas foram otimizadas ergonomicamente para 4 cordas.
        </div>
      )}

      {selectedInst === 'saxophone' && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 6,
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>
              Transposição de Saxofone & Pausas de Respiração
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['Eb', 'Bb'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSaxTransposition(t)}
                  style={{
                    padding: '2px 8px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: saxTransposition === t ? '1px solid #3b82f6' : '1px solid var(--border)',
                    background: saxTransposition === t ? '#3b82f6' : 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Sax {t === 'Eb' ? 'Alto / Barítono (Eb)' : 'Tenor / Soprano (Bb)'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Partitura transposta automaticamente com marcadores de pausa para respiração a cada 4 compassos.
          </div>
        </div>
      )}

      {selectedInst === 'drums' && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: 'rgba(236, 72, 153, 0.1)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          color: '#ec4899',
          fontSize: 12,
          marginBottom: 16,
        }}>
          🥁 <strong>Grade de Bateria (MIDI Grid):</strong> Padrão traduzido para canais independentes de Bumbo (Kick), Caixa (Snare), Chimbal (Hi-Hat) e Prato de Ataque (Crash).
        </div>
      )}

      {/* Dificuldade de Estudo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nível de Desafio Técnico:</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => handleSelectDifficulty(diff)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer',
                border: selectedDiff === diff ? '1px solid #10b981' : '1px solid var(--border)',
                background: selectedDiff === diff ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: selectedDiff === diff ? '#10b981' : 'var(--text-muted)',
                fontWeight: selectedDiff === diff ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {diff === 'beginner' ? 'Iniciante (Shapes fáceis)' : diff === 'intermediate' ? 'Intermediário (Arranjo padrão)' : 'Avançado (Transcrições fiéis)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

