// src/engine/instrumentArrangement.ts
// Ontabs "Play It Your Way" - Motor de Adaptação Multi-Instrumental
// Adaptação idiomática respeitando tessitura, afinações, transposição e perfis de dificuldade.

import { Difficulty, Instrument } from '@/types/domain';
import { MusicalNoteEvent } from './intermediateRepresentation';

export interface InstrumentTessitura {
  minMidi: number;
  maxMidi: number;
  transpositionSemitones: number; // ex: Alto Sax Eb = +9, Tenor Sax Bb = +14
  isTransposingInstrument: boolean;
  standardTuning?: string[];
}

export const INSTRUMENT_TESSITURA: Record<string, InstrumentTessitura> = {
  guitar: { minMidi: 40, maxMidi: 88, transpositionSemitones: 0, isTransposingInstrument: false, standardTuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  acoustic_guitar: { minMidi: 40, maxMidi: 84, transpositionSemitones: 0, isTransposingInstrument: false, standardTuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  bass: { minMidi: 28, maxMidi: 67, transpositionSemitones: 0, isTransposingInstrument: false, standardTuning: ['E1', 'A1', 'D2', 'G2'] },
  bass_5string: { minMidi: 23, maxMidi: 67, transpositionSemitones: 0, isTransposingInstrument: false, standardTuning: ['B0', 'E1', 'A1', 'D2', 'G2'] },
  ukulele: { minMidi: 60, maxMidi: 88, transpositionSemitones: 0, isTransposingInstrument: false, standardTuning: ['G4', 'C4', 'E4', 'A4'] },
  alto_sax: { minMidi: 49, maxMidi: 80, transpositionSemitones: 9, isTransposingInstrument: true }, // Notação Eb (Som C3 soa Eb3)
  tenor_sax: { minMidi: 44, maxMidi: 75, transpositionSemitones: 14, isTransposingInstrument: true }, // Notação Bb (Som C3 soa D4)
  drums: { minMidi: 35, maxMidi: 81, transpositionSemitones: 0, isTransposingInstrument: false },
};

export interface AdaptedInstrumentTrack {
  targetInstrument: Instrument;
  difficulty: Difficulty;
  transpositionApplied: number;
  notes: (MusicalNoteEvent & {
    originalMidi: number;
    octaveShift: number;
    isSimplified?: boolean;
    breathMark?: boolean; // para saxofone
  })[];
  warnings: string[];
}

/**
 * Adapta uma sequência de notas musicais para o instrumento de destino e nível de dificuldade selecionado.
 */
export function adaptTrackForInstrument(
  sourceNotes: MusicalNoteEvent[],
  targetInstrument: Instrument,
  difficulty: Difficulty = 'intermediate'
): AdaptedInstrumentTrack {
  const tess = INSTRUMENT_TESSITURA[targetInstrument] || INSTRUMENT_TESSITURA.guitar;
  const warnings: string[] = [];

  const transposition = tess.transpositionSemitones;
  const adaptedNotes: AdaptedInstrumentTrack['notes'] = [];

  // Se o instrumento for bateria, mapeia para drum grid MIDI padrão General MIDI
  if (targetInstrument === 'drums') {
    return adaptToDrumGrid(sourceNotes, difficulty);
  }

  // Filtragem rítmica com base na dificuldade
  let lastTimestamp = -1;
  const minNoteInterval = difficulty === 'beginner' || difficulty === 'easy' ? 0.35 : 0.05;

  for (let i = 0; i < sourceNotes.length; i++) {
    const note = sourceNotes[i];

    // Simplificação rítmica para iniciantes: agrupa notas muito rápidas
    if (difficulty === 'beginner' || difficulty === 'easy') {
      if (lastTimestamp >= 0 && note.timestamp - lastTimestamp < minNoteInterval) {
        continue; // Descarta passagem excessivamente rápida preservando o tempo forte
      }
    }
    lastTimestamp = note.timestamp;

    let targetMidi = note.midi + transposition;
    let octaveShift = 0;

    // Ajusta oitavas para caber na extensão física do instrumento (tessitura)
    while (targetMidi < tess.minMidi) {
      targetMidi += 12;
      octaveShift += 1;
    }
    while (targetMidi > tess.maxMidi) {
      targetMidi -= 12;
      octaveShift -= 1;
    }

    if (octaveShift !== 0 && !warnings.some((w) => w.includes('deslocamento de oitava'))) {
      warnings.push(`Algumas notas foram transpostas em ${Math.abs(octaveShift)} oitava(s) para caber na extensão do ${targetInstrument}.`);
    }

    // Para saxofone: insere sugestão de respiração em pausas maiores que 0.8s
    let breathMark = false;
    if (targetInstrument === 'saxophone' || targetInstrument === 'alto_sax' || targetInstrument === 'tenor_sax') {
      const nextNote = sourceNotes[i + 1];
      if (nextNote && nextNote.timestamp - (note.timestamp + note.duration) >= 0.8) {
        breathMark = true;
      }
    }

    adaptedNotes.push({
      ...note,
      midi: targetMidi,
      originalMidi: note.midi,
      octaveShift,
      breathMark,
      isSimplified: difficulty === 'beginner' || difficulty === 'easy',
      provenance: 'INFERRED',
    });
  }

  return {
    targetInstrument,
    difficulty,
    transpositionApplied: transposition,
    notes: adaptedNotes,
    warnings,
  };
}

/**
 * Mapeamento rítmico para grade de bateria (Drum Grid).
 * Converte notas melódicas ou onsets para elementos percussivos idiomáticos (Kick, Snare, Hi-Hat).
 */
function adaptToDrumGrid(notes: MusicalNoteEvent[], difficulty: Difficulty): AdaptedInstrumentTrack {
  const drumNotes: AdaptedInstrumentTrack['notes'] = [];

  for (const n of notes) {
    let drumMidi = 42; // Closed Hi-Hat padrão

    // Classificação por frequência / pitch aproximado
    if (n.midi <= 45) {
      drumMidi = 36; // Bumbo (Bass Drum / Kick)
    } else if (n.midi <= 60) {
      drumMidi = 38; // Caixa (Acoustic Snare)
    } else if (n.midi >= 75) {
      drumMidi = 49; // Prato de Ataque (Crash Cymbal)
    } else {
      drumMidi = 42; // Chimbal Fechado (Closed Hi-Hat)
    }

    drumNotes.push({
      ...n,
      midi: drumMidi,
      originalMidi: n.midi,
      octaveShift: 0,
      isSimplified: difficulty === 'beginner',
      provenance: 'INFERRED',
    });
  }

  return {
    targetInstrument: 'drums',
    difficulty,
    transpositionApplied: 0,
    notes: drumNotes,
    warnings: ['Grade de bateria gerada a partir da densidade rítmica de onsets da música.'],
  };
}
