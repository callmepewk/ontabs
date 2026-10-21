// src/engine/__tests__/audioAnalysisIntegration.test.ts
// Testes de Integração e Regressão do Pipeline de Análise de Áudio (Gate J.4)
// Compara o Pipeline Monofônico Padrão vs Crivo Harmônico vs Modo Automático

import { describe, it, expect } from 'vitest';
import { extractFrameNotes } from '../audioAnalysis';
import { analyzeActiveListenerAudioFrame } from '../activeListener';
import { midiToFrequency } from '../notes';

/**
 * Utilitário de síntese controlada com harmônicos físicos (roll-off 1/sqrt(h)).
 */
function synthesizeControlledTone(
  midis: number[],
  amplitudes: number[],
  duration = 0.25,
  sampleRate = 44100,
  harmonicsPerNote = 5,
  noiseLevel = 0.0
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(numSamples);

  for (let n = 0; n < numSamples; n++) {
    const t = n / sampleRate;
    let sample = 0;

    for (let i = 0; i < midis.length; i++) {
      const f0 = midiToFrequency(midis[i]);
      const amp = amplitudes[i] || 0.5;

      for (let h = 1; h <= harmonicsPerNote; h++) {
        const hFreq = f0 * h;
        if (hFreq < sampleRate / 2) {
          sample += (amp / Math.sqrt(h)) * Math.sin(2 * Math.PI * hFreq * t);
        }
      }
    }

    if (noiseLevel > 0) {
      sample += (Math.random() * 2 - 1) * noiseLevel;
    }

    buffer[n] = sample;
  }

  let maxPeak = 0;
  for (let n = 0; n < numSamples; n++) {
    if (Math.abs(buffer[n]) > maxPeak) maxPeak = Math.abs(buffer[n]);
  }
  if (maxPeak > 0) {
    for (let n = 0; n < numSamples; n++) {
      buffer[n] = (buffer[n] / maxPeak) * 0.95;
    }
  }

  return buffer;
}

describe('Gate J.4 — Integração Controlada do Pipeline de Áudio (AudioAnalysis & ActiveListener)', () => {
  const sampleRate = 44100;

  describe('1. Contratos e Comportamento da Estratégia Monofônica (Preservação de Regressão)', () => {
    it('mantém comportamento monofônico estrito com a estratégia padrão', () => {
      const audio = synthesizeControlledTone([69], [0.8], 0.25, sampleRate, 5); // A4 (440 Hz)
      const res = extractFrameNotes(audio, sampleRate, { strategy: 'monophonic' });

      expect(res.strategySelected).toBe('monophonic');
      expect(res.isAbstention).toBe(false);
      expect(res.notes.length).toBe(1);
      expect(res.notes[0].midi).toBe(69);
      expect(Math.abs(res.notes[0].frequency - 440)).toBeLessThan(1.0);
      expect(res.notes[0].strategyUsed).toBe('monophonic');
    });

    it('abstém-se honestamente em silêncio digital absoluto sem lançar exceções', () => {
      const silence = new Float32Array(2048);
      const res = extractFrameNotes(silence, sampleRate, { strategy: 'monophonic' });

      expect(res.isAbstention).toBe(true);
      expect(res.notes).toEqual([]);
      expect(res.decisionReason).toContain('abaixo do limiar de silêncio');
    });

    it('rejeita ruído aperiódico sem periodicidade suficiente', () => {
      const whiteNoise = new Float32Array(2048);
      for (let i = 0; i < 2048; i++) whiteNoise[i] = (Math.random() * 2 - 1) * 0.3;

      const res = extractFrameNotes(whiteNoise, sampleRate, { strategy: 'monophonic' });
      expect(res.isAbstention).toBe(true);
      expect(res.notes).toEqual([]);
    });

    it('comprova limitação esperada da autocorrelação em acordes polifônicos (detecta apenas 1 componente)', () => {
      const dyad = synthesizeControlledTone([52, 59], [0.8, 0.7], 0.25, sampleRate, 5); // E3 + B3
      const res = extractFrameNotes(dyad, sampleRate, { strategy: 'monophonic' });

      // No pipeline monofônico, nunca retorna mais de 1 nota
      expect(res.notes.length).toBeLessThanOrEqual(1);
    });
  });

  describe('2. Estratégia Polifônica por Crivo Harmônico (Execução Real no Pipeline)', () => {
    it('extrai ambas as notas de um power chord de guitarra (Díade E3 + B3)', () => {
      const dyad = synthesizeControlledTone([52, 59], [0.8, 0.7], 0.25, sampleRate, 5);
      const res = extractFrameNotes(dyad, sampleRate, { strategy: 'polyphonic_sieve' });

      expect(res.strategySelected).toBe('polyphonic_sieve');
      expect(res.isAbstention).toBe(false);
      const midis = res.notes.map((n) => n.midi);
      expect(midis).toContain(52);
      expect(midis).toContain(59);
      expect(res.notes.every((n) => n.strategyUsed === 'polyphonic_sieve')).toBe(true);
    });

    it('extrai as 3 notas fundamentais de uma tríade maior de guitarra (C4 + E4 + G4)', () => {
      const triad = synthesizeControlledTone([60, 64, 67], [0.8, 0.7, 0.6], 0.25, sampleRate, 5);
      const res = extractFrameNotes(triad, sampleRate, { strategy: 'polyphonic_sieve' });

      expect(res.isAbstention).toBe(false);
      const midis = res.notes.map((n) => n.midi);
      expect(midis).toContain(60);
      expect(midis).toContain(64);
      expect(midis).toContain(67);
    });

    it('abstém-se em ruído branco puro através do Gate de Tonicidade', () => {
      const noise = new Float32Array(2048);
      for (let i = 0; i < 2048; i++) noise[i] = (Math.random() * 2 - 1) * 0.4;

      const res = extractFrameNotes(noise, sampleRate, { strategy: 'polyphonic_sieve' });
      expect(res.isAbstention).toBe(true);
      expect(res.notes).toEqual([]);
    });
  });

  describe('3. Modo Automático Determinístico (auto)', () => {
    it('seleciona monofônico para linha melódica solo isolada', () => {
      const solo = synthesizeControlledTone([64], [0.8], 0.25, sampleRate, 5); // E4
      const res = extractFrameNotes(solo, sampleRate, { strategy: 'auto' });

      expect(res.isAbstention).toBe(false);
      expect(res.notes.length).toBe(1);
      expect(res.notes[0].midi).toBe(64);
      expect(res.strategySelected).toBe('monophonic');
    });

    it('seleciona polifônico automaticamente quando há parciais harmônicos concorrentes', () => {
      const dyad = synthesizeControlledTone([52, 59], [0.8, 0.7], 0.25, sampleRate, 5);
      const res = extractFrameNotes(dyad, sampleRate, { strategy: 'auto' });

      expect(res.isAbstention).toBe(false);
      expect(res.notes.length).toBeGreaterThanOrEqual(2);
      expect(res.strategySelected).toBe('polyphonic_sieve');
      const midis = res.notes.map((n) => n.midi);
      expect(midis).toContain(52);
      expect(midis).toContain(59);
    });
  });

  describe('4. Integração com Active Listener (Coach Musical e Afinador)', () => {
    it('processa frame de áudio no afinador e calcula desvio em cents', () => {
      // Senoide pura a 442.5 Hz (~+10 cents de A4)
      const numSamples = 2048;
      const audio = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        audio[i] = 0.6 * Math.sin((2 * Math.PI * 442.5 * i) / sampleRate);
      }

      const res = analyzeActiveListenerAudioFrame(audio, sampleRate, { mode: 'tuner' });
      expect(res.tuner).not.toBeNull();
      if (res.tuner) {
        expect(res.tuner.midi).toBe(69);
        expect(res.tuner.noteName).toBe('A');
        expect(res.tuner.octave).toBe(4);
        expect(res.tuner.centsDeviation).toBeGreaterThan(5); // Fora da afinação estrita
        expect(res.tuner.isInTune).toBe(false);
      }
    });

    it('avalia acorde polifônico executado pelo usuário contra referência esperada', () => {
      // Execução de Tríade Maior C4 + E4 + G4
      const chordAudio = synthesizeControlledTone([60, 64, 67], [0.8, 0.7, 0.6], 0.25, sampleRate, 5);

      const res = analyzeActiveListenerAudioFrame(chordAudio, sampleRate, {
        mode: 'chord_feedback',
        expectedChord: 'C',
      });

      expect(res.detectedNotes.length).toBeGreaterThanOrEqual(2);
      expect(res.chordEvaluation).not.toBeNull();
      if (res.chordEvaluation) {
        expect(res.chordEvaluation.isCompatible).toBe(true);
        expect(res.chordEvaluation.status).toBe('MATCH');
        expect(res.chordEvaluation.confidence).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('reconhece inversão válida quando o baixo tocado difere da tônica', () => {
      // Voicing sem a tônica: E4 + G4 (notas da tríade de C maior)
      const inversionAudio = synthesizeControlledTone([64, 67], [0.8, 0.7], 0.25, sampleRate, 5);

      const res = analyzeActiveListenerAudioFrame(inversionAudio, sampleRate, {
        mode: 'chord_feedback',
        expectedChord: 'C',
      });

      expect(res.chordEvaluation).not.toBeNull();
      if (res.chordEvaluation) {
        expect(res.chordEvaluation.isCompatible).toBe(true);
        expect(['MATCH', 'VALID_INVERSION']).toContain(res.chordEvaluation.status);
      }
    });
  });
});
