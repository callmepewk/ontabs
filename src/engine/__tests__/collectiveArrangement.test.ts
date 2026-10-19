// src/engine/__tests__/collectiveArrangement.test.ts
// Testes de Engenharia Musical Coletiva (Annex ONTABS-ANNEX-COLLECTIVE-MUSIC-001)

import { describe, it, expect } from 'vitest';
import {
  classifyPartRelationship,
  inferDoubleGuitarRoles,
  buildArrangementMap,
} from '../collectiveArrangement';
import { adaptTrackForInstrument } from '../instrumentArrangement';
import { calculateTunerPitch, evaluateChordPerformance } from '../activeListener';
import { createEmptyIntermediateRepresentation, addTrackToRepresentation, MusicalNoteEvent } from '../intermediateRepresentation';

describe('Collective Arrangement Intelligence (CAI)', () => {
  const note = (timestamp: number, midi: number, duration = 0.5): MusicalNoteEvent => ({
    id: `n_${timestamp}_${midi}`,
    timestamp,
    duration,
    midi,
    frequency: 440 * Math.pow(2, (midi - 69) / 12),
    provenance: 'OBSERVED',
    confidence: 1.0,
  });

  it('CAI-002: Identifica UNISON quando duas guitarras tocam a mesma nota no mesmo tempo', () => {
    const guitar1 = [note(0.0, 60), note(0.5, 62), note(1.0, 64)];
    const guitar2 = [note(0.0, 60), note(0.5, 62), note(1.0, 64)];

    const rel = classifyPartRelationship(guitar1, guitar2);
    expect(rel.length).toBeGreaterThan(0);
    expect(rel[0].relationship).toBe('UNISON');
    expect(rel[0].confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('CAI-003: Identifica OCTAVE_DOUBLING quando guitarras dobram em oitavas', () => {
    const guitarLow = [note(0.0, 52), note(0.5, 55), note(1.0, 57)]; // E3, G3, A3
    const guitarHigh = [note(0.0, 64), note(0.5, 67), note(1.0, 69)]; // E4, G4, A4 (+12 semitons)

    const rel = classifyPartRelationship(guitarLow, guitarHigh);
    expect(rel.length).toBeGreaterThan(0);
    expect(rel[0].relationship).toBe('OCTAVE_DOUBLING');
  });

  it('CAI-003b: Identifica HARMONIZED quando guitarras tocam terças paralelas', () => {
    const melodyA = [note(0.0, 60), note(0.5, 62), note(1.0, 64)]; // C4, D4, E4
    const melodyB = [note(0.0, 64), note(0.5, 65), note(1.0, 67)]; // E4, F4, G4 (terças)

    const rel = classifyPartRelationship(melodyA, melodyB);
    expect(rel.length).toBeGreaterThan(0);
    expect(rel[0].relationship).toBe('HARMONIZED');
  });

  it('CAI-001: Identifica RHYTHMIC_COMPLEMENT quando ataques são alternados', () => {
    const partA = [note(0.0, 60), note(1.0, 60)];
    const partB = [note(0.5, 64), note(1.5, 64)]; // intercaladas

    const rel = classifyPartRelationship(partA, partB);
    expect(rel.length).toBeGreaterThan(0);
    expect(rel[0].relationship).toBe('RHYTHMIC_COMPLEMENT');
  });

  it('Double Guitar Intelligence: Infere Lead vs. Rhythm baseado em registro e densidade', () => {
    // Guitarra rítmica toca acordes graves espaçados
    const rhythmGuitar = [note(0.0, 40), note(1.0, 45), note(2.0, 43)];
    // Guitarra solo toca notas rápidas no registro agudo
    const leadGuitar = [
      note(0.0, 72), note(0.2, 74), note(0.4, 76), note(0.6, 79),
      note(1.0, 76), note(1.2, 74), note(1.5, 72), note(1.8, 79),
    ];

    const roles = inferDoubleGuitarRoles(leadGuitar, rhythmGuitar);
    expect(roles.roleA).toBe('lead');
    expect(roles.roleB).toBe('rhythm');
    expect(roles.confidence).toBeGreaterThan(0.7);
  });

  it('Arrangement Map: Mapeia intervalos de atividade e transições entre seções', () => {
    const ir = createEmptyIntermediateRepresentation({
      songId: 'song_test',
      title: 'Rock Anthem',
      artist: 'Band Test',
      durationSeconds: 60,
    });

    ir.sections = [
      {
        id: 's_intro',
        name: 'Intro',
        startTime: 0,
        endTime: 15,
        bpm: 120,
        timeSignature: [4, 4],
        key: 'A',
        activeInstruments: ['guitar'],
        provenance: 'INFERRED',
      },
      {
        id: 's_verse',
        name: 'Verse',
        startTime: 15,
        endTime: 45,
        bpm: 120,
        timeSignature: [4, 4],
        key: 'A',
        activeInstruments: ['guitar', 'bass', 'drums'],
        provenance: 'INFERRED',
      },
    ];

    const irWithTrack = addTrackToRepresentation(ir, {
      id: 'trk_gtr',
      instrument: 'guitar',
      name: 'Guitarra Principal',
      role: 'lead',
      tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      notes: [note(1.0, 60), note(2.0, 62), note(16.0, 64)],
    });

    const map = buildArrangementMap(irWithTrack);
    expect(map.tracks.length).toBe(1);
    expect(map.transitions.length).toBe(1);
    expect(map.transitions[0].fromSection).toBe('Intro');
    expect(map.transitions[0].toSection).toBe('Verse');
    expect(map.transitions[0].activeInstrumentChanges.entered).toContain('bass');
    expect(map.transitions[0].activeInstrumentChanges.entered).toContain('drums');
  });
});

describe('Multi-Instrument Adaptation ("Play It Your Way")', () => {
  const note = (timestamp: number, midi: number, duration = 0.5): MusicalNoteEvent => ({
    id: `n_${timestamp}_${midi}`,
    timestamp,
    duration,
    midi,
    frequency: 440 * Math.pow(2, (midi - 69) / 12),
    provenance: 'OBSERVED',
    confidence: 1.0,
  });

  it('Adapta linha aguda de guitarra para o baixo com transposição de oitava', () => {
    // Nota MIDI 72 (C5) excede o limite máximo de baixo convencional (~67)
    const guitarNotes = [note(0.0, 72), note(0.5, 74)];
    const adapted = adaptTrackForInstrument(guitarNotes, 'bass', 'intermediate');

    expect(adapted.targetInstrument).toBe('bass');
    expect(adapted.notes[0].midi).toBeLessThanOrEqual(67);
    expect(adapted.notes[0].octaveShift).toBeLessThan(0);
    expect(adapted.warnings.length).toBeGreaterThan(0);
  });

  it('Adapta para Saxofone Alto (Eb) aplicando transposição de +9 semitons e respiração', () => {
    // Frase com pausa de 1.0 segundo entre notas
    const melodicNotes = [note(0.0, 60, 0.5), note(1.5, 62, 0.5)];
    const adapted = adaptTrackForInstrument(melodicNotes, 'alto_sax', 'intermediate');

    expect(adapted.transpositionApplied).toBe(9);
    // C4 (60) em tom de concerto soa como A4 (69) na notação Eb transposta
    expect(adapted.notes[0].midi).toBe(69);
    expect(adapted.notes[0].breathMark).toBe(true);
  });

  it('Adapta para Bateria mapeando frequências para elementos de Drum Grid (Kick, Snare, Hi-Hat)', () => {
    const rawNotes = [
      note(0.0, 36), // Grave -> Kick (36)
      note(0.5, 55), // Médio -> Snare (38)
      note(1.0, 80), // Agudo -> Crash (49)
    ];

    const adapted = adaptTrackForInstrument(rawNotes, 'drums', 'intermediate');
    expect(adapted.notes[0].midi).toBe(36); // Kick
    expect(adapted.notes[1].midi).toBe(38); // Snare
    expect(adapted.notes[2].midi).toBe(49); // Crash
  });
});

describe('Active Listener & Non-Judgmental Coaching', () => {
  it('Afinador calcula nota exata e desvio em cents para A4 (440Hz)', () => {
    const tuner = calculateTunerPitch(440.0, 440);
    expect(tuner).not.toBeNull();
    expect(tuner?.noteName).toBe('A');
    expect(tuner?.octave).toBe(4);
    expect(tuner?.centsDeviation).toBe(0.0);
    expect(tuner?.isInTune).toBe(true);
  });

  it('Afinador detecta desafinação positiva quando frequência está acima', () => {
    const tuner = calculateTunerPitch(445.0, 440);
    expect(tuner).not.toBeNull();
    expect(tuner?.centsDeviation).toBeGreaterThan(15);
    expect(tuner?.isInTune).toBe(false);
  });

  it('CAI-011: Reconhece inversão harmônica válida (baixo alternativo) sem julgar como erro', () => {
    // Exemplo: Música pede acorde C (C-E-G), mas usuário tocou E e G (inversão com terça no baixo)
    const result = evaluateChordPerformance('C', [64, 67]); // E4, G4
    expect(result.status).toBe('VALID_INVERSION');
    expect(result.isCompatible).toBe(true);
    expect(result.message).toContain('inversão');
  });

  it('CAI-011b: Reconhece variação criativa autoral em vez de emitir mensagem punitiva', () => {
    // Acorde esperado é C, usuário tocou notas fora da tríade (ex: F#, A#)
    const result = evaluateChordPerformance('C', [66, 70]);
    expect(result.status).toBe('CREATIVE_VARIATION');
    expect(result.isCompatible).toBe(false);
    expect(result.message).not.toMatch(/errado|incorreto/i);
    expect(result.message).toContain('arranjo autoral');
  });
});
