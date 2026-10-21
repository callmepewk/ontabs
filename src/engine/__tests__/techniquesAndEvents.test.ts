// src/engine/__tests__/techniquesAndEvents.test.ts
// Testes unitários para Modelo Canônico de Eventos, Taxonomia de Técnicas e Harmonia Avançada

import { describe, it, expect } from 'vitest';
import {
  CanonicalMusicalEvent,
  validateCanonicalEvent,
  quantizeTimestamp,
  secondsToMusicalPosition,
  canonicalEventsToTabNotes,
} from '../canonicalEvents';
import {
  isTechniqueAllowed,
  getTechniqueTabSymbol,
  analyzePitchTrajectory,
  TECHNIQUE_CATALOG,
} from '../techniques';
import {
  identifyChordFromChroma,
  identifyChordWithAmbiguity,
  notesToChroma,
} from '../chords';

describe('Canonical Musical Event Model & Validation', () => {
  it('valida evento canônico válido de guitarra com sucesso', () => {
    const event: CanonicalMusicalEvent = {
      version: 1,
      id: 'ev_001',
      timestamp: 1.5,
      duration: 0.5,
      instrument: 'guitar',
      pitch: 62, // D4
      frequency: 293.66,
      stringNumber: 3,
      fret: 7,
      velocity: 95,
      confidence: 0.98,
      provenance: 'OBSERVED',
      articulation: 'vibrato',
    };

    const res = validateCanonicalEvent(event);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejeita evento com limites físicos violados (fret 28, velocity 150, confiança negativa)', () => {
    const invalidEvent: CanonicalMusicalEvent = {
      version: 1,
      id: 'ev_invalid',
      timestamp: -0.5,
      duration: 0,
      instrument: 'guitar',
      fret: 28, // violando 0..24
      stringNumber: 9, // violando 1..8
      velocity: 150, // violando 0..127
      confidence: -0.2, // violando 0..1
      provenance: 'INFERRED',
    };

    const res = validateCanonicalEvent(invalidEvent);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(5);
  });

  it('exige drumPiece para eventos percussivos de bateria', () => {
    const drumWithoutPiece: CanonicalMusicalEvent = {
      version: 1,
      id: 'ev_drum',
      timestamp: 0.0,
      duration: 0.2,
      instrument: 'drums',
      velocity: 110,
      confidence: 0.95,
      provenance: 'OBSERVED',
    };

    const res = validateCanonicalEvent(drumWithoutPiece);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('drumPiece'))).toBe(true);
  });

  it('rejeita técnica de slap em saxofone ou embocadura em bateria', () => {
    const saxWithSlap: CanonicalMusicalEvent = {
      version: 1,
      id: 'ev_sax_slap',
      timestamp: 2.0,
      duration: 1.0,
      instrument: 'saxophone',
      velocity: 80,
      confidence: 0.9,
      provenance: 'OBSERVED',
      articulation: 'slap', // Slap é de baixo
    };

    const res = validateCanonicalEvent(saxWithSlap);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('incompatível com o instrumento');
  });

  it('quantiza timestamps corretamente para a grade de semicolcheia (1/16)', () => {
    // 120 BPM: 1 beat = 0.5s. 1/16 = 0.125s
    const bpm = 120;
    expect(quantizeTimestamp(0.12, bpm, 16)).toBeCloseTo(0.125, 3);
    expect(quantizeTimestamp(0.24, bpm, 16)).toBeCloseTo(0.25, 3);
    expect(quantizeTimestamp(0.38, bpm, 16)).toBeCloseTo(0.375, 3);
  });

  it('converte segundos em compasso, tempo e tick (PPQ 480)', () => {
    // 120 BPM: cada compasso de 4 tempos dura 2.0 segundos.
    const posIntro = secondsToMusicalPosition(0.0, 120);
    expect(posIntro).toEqual({ measure: 1, beat: 1, tick: 0 });

    // Em t = 2.5s (1 compasso + 1 beat): measure 2, beat 2, tick 0
    const posMeasure2 = secondsToMusicalPosition(2.5, 120);
    expect(posMeasure2).toEqual({ measure: 2, beat: 2, tick: 0 });

    // Em t = 0.25s (meio beat a 120 BPM): measure 1, beat 1, tick 240
    const posHalfBeat = secondsToMusicalPosition(0.25, 120);
    expect(posHalfBeat).toEqual({ measure: 1, beat: 1, tick: 240 });
  });

  it('converte CanonicalMusicalEvents para TabNoteEvents consolidados', () => {
    const events: CanonicalMusicalEvent[] = [
      {
        version: 1,
        id: 'e1',
        timestamp: 1.0,
        duration: 0.5,
        instrument: 'guitar',
        stringNumber: 6,
        fret: 3,
        velocity: 100,
        confidence: 0.9,
        provenance: 'OBSERVED',
      },
      {
        version: 1,
        id: 'e2',
        timestamp: 1.0,
        duration: 0.5,
        instrument: 'guitar',
        stringNumber: 5,
        fret: 5,
        velocity: 100,
        confidence: 0.9,
        provenance: 'OBSERVED',
      },
    ];

    const tabNotes = canonicalEventsToTabNotes(events);
    expect(tabNotes).toHaveLength(1);
    expect(tabNotes[0].timestamp).toBe(1.0);
    expect(tabNotes[0].strings).toEqual([3, 5]);
    expect(tabNotes[0].sustainMs).toBe(500);
  });
});

describe('Multi-Instrument Technique Taxonomy & Trajectory DSP', () => {
  it('possui catálogo completo com símbolos de tablatura e notação', () => {
    expect(getTechniqueTabSymbol('hammer_on')).toBe('h');
    expect(TECHNIQUE_CATALOG['hammer_on'].tabSymbol).toBe('h');
    expect(TECHNIQUE_CATALOG['pull_off'].tabSymbol).toBe('p');
    expect(TECHNIQUE_CATALOG['bend'].tabSymbol).toBe('b');
    expect(TECHNIQUE_CATALOG['vibrato'].tabSymbol).toBe('~');
    expect(TECHNIQUE_CATALOG['palm_mute'].tabSymbol).toBe('PM');
    expect(isTechniqueAllowed('guitar', 'bend')).toBe(true);
    expect(isTechniqueAllowed('bass', 'slap')).toBe(true);
    expect(isTechniqueAllowed('drums', 'rimshot')).toBe(true);
    expect(isTechniqueAllowed('tenor_sax', 'growl')).toBe(true);
  });

  it('detecta Bend de corda (+1 tom / +2 semitons) a partir da trajetória de F0', () => {
    // Curva de pitch subindo suavemente de MIDI 62 (D4) para 64 (E4)
    const trajectory = [
      { time: 0.0, midi: 62.0, clarity: 0.95 },
      { time: 0.1, midi: 62.5, clarity: 0.94 },
      { time: 0.2, midi: 63.2, clarity: 0.95 },
      { time: 0.3, midi: 63.8, clarity: 0.96 },
      { time: 0.4, midi: 64.0, clarity: 0.96 },
    ];

    const res = analyzePitchTrajectory(trajectory);
    expect(res.detectedTechniques).toContain('bend');
    expect(res.pitchDriftSemitones).toBeCloseTo(2.0, 1);
  });

  it('detecta Vibrato periódico (oscilação a ~5 Hz) com profundidade em cents', () => {
    // 5 ciclos por segundo, modulação senoidal de ±0.3 semitons (±30 cents) em torno de MIDI 69 (A4)
    const trajectory = [];
    for (let i = 0; i < 40; i++) {
      const t = i * 0.015; // duração total 0.6s
      const midiOsc = 69.0 + 0.3 * Math.sin(2 * Math.PI * 5 * t);
      trajectory.push({ time: t, midi: midiOsc, clarity: 0.92 });
    }

    const res = analyzePitchTrajectory(trajectory);
    expect(res.vibratoDetected).toBe(true);
    expect(res.vibratoRateHz).toBeGreaterThanOrEqual(4.5);
    expect(res.vibratoRateHz).toBeLessThanOrEqual(5.5);
    expect(res.vibratoDepthCents).toBeGreaterThanOrEqual(25);
    expect(res.detectedTechniques).toContain('vibrato');
  });
});

describe('Extended Harmonic Theory & Ambiguity Analysis', () => {
  it('reconhece acordes estendidos: Cmaj9, D7sus4 e Bm7b5', () => {
    // Cmaj9: C (0), D (2), E (4), G (7), B (11)
    const chromaCmaj9 = notesToChroma(['C4', 'D4', 'E4', 'G4', 'B4']);
    const cmaj9Cands = identifyChordFromChroma(chromaCmaj9, 2);
    expect(cmaj9Cands[0].name).toBe('Cmaj9');
    expect(cmaj9Cands[0].score).toBeGreaterThan(0.9);

    // Bm7b5: B (11), D (2), F (5), A (9) -> intervals a partir de B: 0, 3, 6, 10
    const chromaBm7b5 = notesToChroma(['B3', 'D4', 'F4', 'A4']);
    const bm7b5Cands = identifyChordFromChroma(chromaBm7b5, 2);
    expect(bm7b5Cands[0].name).toBe('Bm7b5');
    expect(bm7b5Cands[0].score).toBeGreaterThan(0.9);
  });

  it('identifica acordes invertidos / slash chords (ex: D com baixo em F# -> D/F#)', () => {
    const chromaD = notesToChroma(['D4', 'F#4', 'A4']);
    const analysis = identifyChordWithAmbiguity(chromaD, 'F#');
    expect(analysis.primaryChord?.name).toBe('D');
    expect(analysis.slashChord).toBe('D/F#');
  });

  it('calcula ratio de ambiguidade harmônica para conjuntos polissêmicos (C6 vs Am7)', () => {
    // Notas: C, E, G, A formam C6 e também Am7 (inversão)
    const ambiguousChroma = notesToChroma(['C4', 'E4', 'G4', 'A4']);
    const analysis = identifyChordWithAmbiguity(ambiguousChroma);
    expect(analysis.candidates.length).toBeGreaterThanOrEqual(2);
    // Ambos C6 e Am7 compartilham exatamente o mesmo conjunto de alturas (pitch-class set)
    expect(analysis.isAmbiguous).toBe(true);
    expect(analysis.ambiguityRatio).toBeGreaterThanOrEqual(0.95);
  });
});
