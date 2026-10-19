// src/engine/activeListener.ts
// Ontabs Active Listener - Assistente e Coach Musical Colaborativo
// Afinação cromática em cents e feedback pedagógico sem julgamento ("Divergência vs. Erro").

import { midiToScientific, pitchClassToChromaticIndex, CHROMATIC_SHARPS } from './notes';
import { CHORD_TEMPLATES } from './chords';

export interface TunerResult {
  frequency: number;
  noteName: string;
  octave: number;
  midi: number;
  centsDeviation: number; // -50 a +50
  isInTune: boolean; // desvio <= 5 cents
  referenceA4: number;
}

export interface ChordEvaluationResult {
  expectedChord: string;
  detectedNotes: string[];
  status: 'MATCH' | 'VALID_INVERSION' | 'SIMPLIFIED_VOICING' | 'CREATIVE_VARIATION' | 'UNCERTAIN';
  message: string;
  isCompatible: boolean;
  confidence: number;
}

/**
 * Calcula a nota mais próxima e o desvio em cents para o afinador cromático.
 */
export function calculateTunerPitch(frequency: number, referenceA4 = 440): TunerResult | null {
  if (frequency <= 20 || frequency >= 5000 || isNaN(frequency)) {
    return null;
  }

  const exactMidi = 69 + 12 * Math.log2(frequency / referenceA4);
  const midi = Math.round(exactMidi);
  const centsDeviation = Number(((exactMidi - midi) * 100).toFixed(1));

  const noteScientific = midiToScientific(midi);
  const match = noteScientific.match(/^([A-G][#b]?)(-?\d+)$/);
  const noteName = match ? match[1] : noteScientific;
  const octave = match ? parseInt(match[2], 10) : 4;

  return {
    frequency: Number(frequency.toFixed(2)),
    noteName,
    octave,
    midi,
    centsDeviation,
    isInTune: Math.abs(centsDeviation) <= 5,
    referenceA4,
  };
}

/**
 * Avalia a compatibilidade de um acorde executado pelo usuário em relação a uma referência.
 * Aplica a regra de não julgamento: inversões e voicings alternativos são reconhecidos como válidos.
 */
export function evaluateChordPerformance(
  expectedChordName: string,
  detectedMidiNotes: number[]
): ChordEvaluationResult {
  if (detectedMidiNotes.length === 0) {
    return {
      expectedChord: expectedChordName,
      detectedNotes: [],
      status: 'UNCERTAIN',
      message: 'Nenhum sinal claro de acorde detectado nesta passagem.',
      isCompatible: false,
      confidence: 0.2,
    };
  }

  const detectedNames = Array.from(new Set(detectedMidiNotes.map((m) => midiToScientific(m).replace(/-?\d+$/, ''))));

  // Heurística de compatibilidade harmônica
  const expectedRoot = expectedChordName.slice(0, 1);
  const isMinor = expectedChordName.includes('m') && !expectedChordName.includes('maj');

  let chordTones: string[] = [];
  try {
    const rootIndex = pitchClassToChromaticIndex(expectedRoot);
    const intervals = isMinor ? CHORD_TEMPLATES.min.intervals : CHORD_TEMPLATES.maj.intervals;
    chordTones = intervals.map((i) => CHROMATIC_SHARPS[(rootIndex + i) % 12]);
  } catch {
    chordTones = [expectedRoot];
  }

  const hasRoot = detectedNames.some((d) => {
    try {
      return pitchClassToChromaticIndex(d) === pitchClassToChromaticIndex(expectedRoot);
    } catch {
      return false;
    }
  });

  const matchesAnyChordTone = detectedNames.some((d) => {
    try {
      const idx = pitchClassToChromaticIndex(d);
      return chordTones.some((ct) => pitchClassToChromaticIndex(ct) === idx);
    } catch {
      return false;
    }
  });

  if (hasRoot && detectedNames.length >= 2) {
    return {
      expectedChord: expectedChordName,
      detectedNotes: detectedNames,
      status: 'MATCH',
      message: 'Execução do acorde compatível com as notas da referência original.',
      isCompatible: true,
      confidence: 0.9,
    };
  }

  // Verifica se o baixo tocado é a terça ou quinta (inversão válida contendo notas do acorde)
  if (!hasRoot && matchesAnyChordTone && detectedNames.length >= 2) {
    return {
      expectedChord: expectedChordName,
      detectedNotes: detectedNames,
      status: 'VALID_INVERSION',
      message: 'Sua execução parece compatível com uma inversão ou voicing harmônico alternativo.',
      isCompatible: true,
      confidence: 0.75,
    };
  }

  return {
    expectedChord: expectedChordName,
    detectedNotes: detectedNames,
    status: 'CREATIVE_VARIATION',
    message: 'Sua interpretação difere da referência original da gravação; pode funcionar como arranjo autoral.',
    isCompatible: false,
    confidence: 0.6,
  };
}

export const ACTIVE_LISTENER_PRIVACY_DISCLOSURE = {
  mode: 'BROWSER_LOCAL_ONLY',
  audioStorage: 'EPHEMERAL_BUFFER_ZERO_RETENTION',
  serverUpload: false,
  consentRequired: true,
  description: 'O Active Listener processa o áudio do seu microfone 100% no seu navegador para afinador e feedback em tempo real. Nenhum áudio pessoal é gravado ou transmitido para servidores.',
};
