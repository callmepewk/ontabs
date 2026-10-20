// src/components/EqualizerControl.tsx
// Ontabs 5-Band Study Equalizer Control Panel (Phase 10)

import React, { useState } from 'react';
import { EQUALIZER_BANDS, EQUALIZER_PRESETS, EqualizerPreset } from '@/engine/equalizer';

export const EqualizerControl: React.FC = () => {
  const [gains, setGains] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState<string>('flat');

  function handleGainChange(bandIndex: number, value: number) {
    const updated = [...gains] as [number, number, number, number, number];
    updated[bandIndex] = value;
    setGains(updated);
    setActivePreset('custom');
  }

  function applyPreset(presetKey: string) {
    const p = EQUALIZER_PRESETS[presetKey];
    if (p) {
      setGains([...p.gains]);
      setActivePreset(presetKey);
    }
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20, background: '#0e0f17', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎚️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Equalizador de 5 Faixas para Estudo</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Isole instrumentos na mixagem usando filtros biquad da Web Audio API
            </span>
          </div>
        </div>

        {/* Botões de Presets */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(EQUALIZER_PRESETS).map(([key, p]: [string, EqualizerPreset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
                border: activePreset === key ? '1px solid #10b981' : '1px solid var(--border)',
                background: activePreset === key ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: activePreset === key ? '#10b981' : 'var(--text-muted)',
                fontWeight: activePreset === key ? 600 : 400,
              }}
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders das 5 Bandas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, textAlign: 'center', marginTop: 12 }}>
        {EQUALIZER_BANDS.map((b, idx) => (
          <div key={b.frequency} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
              {gains[idx] > 0 ? `+${gains[idx]}` : gains[idx]} dB
            </span>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={gains[idx]}
              onChange={(e) => handleGainChange(idx, Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#10b981',
                cursor: 'pointer',
              }}
            />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
              {b.label}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              {b.type} · {b.frequency} Hz
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
