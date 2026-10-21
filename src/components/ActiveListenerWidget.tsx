// src/components/ActiveListenerWidget.tsx
// Ontabs Active Listener: Afinador Cromático em Cents & Feedback Não Punitivo (Annex 001)

import React, { useState } from 'react';
import { calculateTunerPitch, ACTIVE_LISTENER_PRIVACY_DISCLOSURE } from '@/engine/activeListener';

export const ActiveListenerWidget: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [detectedNote, setDetectedNote] = useState<string>('A');
  const [detectedFreq, setDetectedFreq] = useState<number>(440.0);
  const [targetFreq, setTargetFreq] = useState<number>(440.0);
  const [centsDeviation, setCentsDeviation] = useState<number>(0);
  const [coachFeedback, setCoachFeedback] = useState<{
    status: 'PERFECT_MATCH' | 'VALID_INVERSION' | 'CREATIVE_VARIATION' | 'DISSONANT';
    message: string;
  }>({
    status: 'PERFECT_MATCH',
    message: 'Execução precisa no centro harmônico da composição.',
  });

  function toggleListening() {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulação auditiva de teste com cents reais calculados pela fórmula matemática
      const freq = 442.5;
      const tunerResult = calculateTunerPitch(freq, 440.0);
      setDetectedNote(tunerResult?.noteName || 'A4');
      setDetectedFreq(freq);
      setTargetFreq(440.0);
      setCentsDeviation(tunerResult?.centsDeviation || 0);
      setCoachFeedback({
        status: 'VALID_INVERSION',
        message: 'Inversão válida detectada: nota pertence ao acorde com terça no baixo (Coach Não-Punitivo).',
      });
    }
  }

  // Cor do medidor de cents: verde no centro, amarelo nas bordas, vermelho se muito desafinado
  const absCents = Math.abs(centsDeviation);
  const needleColor = absCents <= 5 ? '#10b981' : absCents <= 15 ? '#ffd166' : '#ef4444';

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20, background: '#0e0f17', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎙️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Ouvinte Ativo & Afinador Cromático em Cents</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Feedback não punitivo (inversões válidas, variações criativas) e afinação em tempo real
            </span>
          </div>
        </div>

        <button
          className="btn"
          onClick={toggleListening}
          style={{
            background: isListening ? '#ef4444' : '#10b981',
            color: '#000',
            fontWeight: 700,
            fontSize: 12,
            padding: '6px 14px',
          }}
        >
          {isListening ? '⏹ Parar Escuta' : '▶ Ativar Microfone'}
        </button>
      </div>

      {/* Afinador e Ponteiro de Cents */}
      <div style={{
        background: '#0a0a10',
        borderRadius: 8,
        padding: '16px 20px',
        border: '1px solid var(--border)',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{detectedNote}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {detectedFreq.toFixed(1)} Hz (Alvo: {targetFreq} Hz)
          </span>
        </div>

        {/* Medidor Analógico de Cents (-50 a +50 cents) */}
        <div style={{ width: '100%', maxWidth: 360, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>-50¢ (Baixo)</span>
            <span>-25¢</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>0¢ (Ideal)</span>
            <span>+25¢</span>
            <span>+50¢ (Alto)</span>
          </div>

          <div style={{ position: 'relative', height: 12, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 6, overflow: 'hidden' }}>
            {/* Marcador central */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'rgba(255, 255, 255, 0.4)', transform: 'translateX(-50%)' }} />
            {/* Ponteiro */}
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(98, Math.max(2, 50 + centsDeviation))}%`,
                top: 0,
                bottom: 0,
                width: 8,
                borderRadius: 4,
                background: needleColor,
                transform: 'translateX(-50%)',
                boxShadow: `0 0 8px ${needleColor}`,
                transition: 'all 0.2s ease',
              }}
            />
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, marginTop: 6, color: needleColor, fontWeight: 600 }}>
            Desvio: {centsDeviation > 0 ? `+${centsDeviation}` : centsDeviation} cents
            {absCents <= 5 ? ' (Afinação Perfeita)' : absCents <= 15 ? ' (Aceitável no contexto)' : ' (Ajuste a corda)'}
          </div>
        </div>
      </div>

      {/* Avaliação do Coach Não-Punitivo */}
      <div style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: coachFeedback.status === 'PERFECT_MATCH' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 209, 102, 0.1)',
        border: `1px solid ${coachFeedback.status === 'PERFECT_MATCH' ? '#10b981' : '#ffd166'}`,
        marginBottom: 12,
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 600, color: coachFeedback.status === 'PERFECT_MATCH' ? '#10b981' : '#ffd166', marginBottom: 2 }}>
          {coachFeedback.status === 'VALID_INVERSION' ? '💡 Inversão Harmônica Válida' :
           coachFeedback.status === 'CREATIVE_VARIATION' ? '🎨 Variação Criativa Reconhecida' :
           '✓ Centro Harmônico Preciso'}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {coachFeedback.message}
        </div>
      </div>

      {/* Garantia de Privacidade Local */}
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '6px 10px',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>🔒</span>
        <span>{ACTIVE_LISTENER_PRIVACY_DISCLOSURE.description}</span>
      </div>
    </div>
  );
};
