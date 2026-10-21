// src/engine/__tests__/electricBass.test.ts
// Ontabs Unit & Integration Tests: Electric Bass Engine & Stem Separation Architecture (Gate 2 & 3)

import { describe, it, expect } from 'vitest';
import {
  ELECTRIC_BASS_TUNINGS,
  getBassPositionsForMidi,
  optimizeBassFingerings,
  transcribeElectricBass,
} from '../electricBass';
import {
  validateStemsIntegrity,
  OfflineStemSeparationProvider,
  MultiTrackFixtureProvider,
  StemTrackInfo,
} from '../stemSeparation';
import { MusicalNoteEvent, createMusicalNoteEvent } from '../intermediateRepresentation';

describe('Ontabs Electric Bass Engine - Idiomatic Bass Modeling & Ergonomics', () => {
  it('Define modelos e afinações canônicas de 4, 5 e 6 cordas com fundamentais corretas', () => {
    const bass4 = ELECTRIC_BASS_TUNINGS.standard_4;
    expect(bass4.stringCount).toBe(4);
    expect(bass4.stringMidis).toEqual([28, 33, 38, 43]); // E1, A1, D2, G2
    expect(bass4.fundamentalFrequencies[0]).toBeCloseTo(41.2, 1); // E1 ~41.2 Hz

    const bass5 = ELECTRIC_BASS_TUNINGS.standard_5;
    expect(bass5.stringCount).toBe(5);
    expect(bass5.stringMidis[0]).toBe(23); // B0
    expect(bass5.fundamentalFrequencies[0]).toBeCloseTo(30.87, 1); // B0 ~30.87 Hz

    const bass6 = ELECTRIC_BASS_TUNINGS.standard_6;
    expect(bass6.stringCount).toBe(6);
    expect(bass6.stringMidis[5]).toBe(48); // C3
    expect(bass6.fundamentalFrequencies[5]).toBeCloseTo(130.81, 1); // C3 ~130.81 Hz

    const dropD = ELECTRIC_BASS_TUNINGS.drop_d_4;
    expect(dropD.stringMidis[0]).toBe(26); // D1
  });

  it('Calcula posições no braço do baixo elétrico 4 cordas respeitando casas 0 a 24', () => {
    // Nota A1 (MIDI 33) pode ser tocada como Corda A solta (corda 3, casa 0) ou Corda E na 5ª casa (corda 4, casa 5)
    const positions = getBassPositionsForMidi(33, ELECTRIC_BASS_TUNINGS.standard_4);
    expect(positions.length).toBeGreaterThanOrEqual(2);

    const openA = positions.find((p) => p.fret === 0);
    expect(openA).toBeDefined();
    expect(openA?.stringIndex).toBe(3); // Corda 3 (A)

    const fifthFretE = positions.find((p) => p.fret === 5);
    expect(fifthFretE).toBeDefined();
    expect(fifthFretE?.stringIndex).toBe(4); // Corda 4 (E)
  });

  it('Otimiza digitação de linha de baixo favorecendo região grave e casas 1-7', () => {
    // Linha de baixo de rock clássico: E1, G1, A1, B1
    const testNotes: MusicalNoteEvent[] = [
      createMusicalNoteEvent({ timestamp: 0.0, duration: 0.5, midi: 28 }), // E1
      createMusicalNoteEvent({ timestamp: 0.5, duration: 0.5, midi: 31 }), // G1
      createMusicalNoteEvent({ timestamp: 1.0, duration: 0.5, midi: 33 }), // A1
      createMusicalNoteEvent({ timestamp: 1.5, duration: 0.5, midi: 35 }), // B1
    ];

    const tab = optimizeBassFingerings(testNotes, ELECTRIC_BASS_TUNINGS.standard_4, 34);
    expect(tab.length).toBe(4);

    // E1 deve ser a corda 4 solta (casa 0)
    expect(tab[0].stringIndex).toBe(4);
    expect(tab[0].fret).toBe(0);

    // Todas as notas devem estar na região 0 a 5 no braço
    for (const note of tab) {
      expect(note.fret).toBeLessThanOrEqual(7);
      expect(note.technique).toBe('fingerstyle_pluck');
    }
  });

  it('Identifica notas fantasma (ghost notes) por duração rítmica inferior a 60ms', () => {
    const grooveNotes: MusicalNoteEvent[] = [
      createMusicalNoteEvent({ timestamp: 0.0, duration: 0.4, midi: 33 }),
      createMusicalNoteEvent({ timestamp: 0.4, duration: 0.04, midi: 33, confidence: 0.7 }), // Ghost note percussiva
      createMusicalNoteEvent({ timestamp: 0.5, duration: 0.35, midi: 35 }),
    ];

    const transcription = transcribeElectricBass(grooveNotes, ELECTRIC_BASS_TUNINGS.standard_4);
    expect(transcription.techniqueDistribution.ghost_note).toBe(1);
    expect(transcription.techniqueDistribution.fingerstyle_pluck).toBe(2);
    expect(transcription.notes[1].ghostNote).toBe(true);
  });

  it('Gera alerta explicativo quando notas caem abaixo da tessitura física do baixo 4 cordas', () => {
    const lowNotes: MusicalNoteEvent[] = [
      createMusicalNoteEvent({ timestamp: 0.0, duration: 0.5, midi: 24 }), // C1 (< 28 E1)
    ];

    const transcription = transcribeElectricBass(lowNotes, ELECTRIC_BASS_TUNINGS.standard_4);
    expect(transcription.warnings.length).toBeGreaterThan(0);
    expect(transcription.warnings[0]).toContain('fora da extensão física');
  });
});

describe('Ontabs Stem Separation & Operational Providers (Gate 2 & 3)', () => {
  it('OfflineStemSeparationProvider declara honestamente status BLOCKED sem simular áudio falso', async () => {
    const provider = new OfflineStemSeparationProvider();
    const availability = await provider.isAvailable();
    expect(availability.available).toBe(false);

    const result = await provider.separateStems('test_audio.wav');
    expect(result.status).toBe('BLOCKED');
    expect(result.stems.drums).toBeNull();
    expect(result.stems.bass).toBeNull();
    expect(result.validation.allStemsTimeAligned).toBe(false);
    expect(result.notes[1]).toContain('Nenhum áudio sintético ou falso substituto foi injetado');
  });

  it('MultiTrackFixtureProvider valida alinhamento temporal e conformidade de taxa de amostragem', async () => {
    const provider = new MultiTrackFixtureProvider(10.0, 44100);
    const result = await provider.separateStems('fixture_track.wav');

    expect(result.status).toBe('PASS');
    expect(result.validation.allStemsTimeAligned).toBe(true);
    expect(result.validation.sampleRateConsistent).toBe(true);
    expect(result.validation.durationDeviationMs).toBe(0);
    expect(result.validation.hasClipping).toBe(false);
    expect(result.validation.accompanimentDistinctionVerified).toBe(true);

    // Confirma que o stem "other" está catalogado como acompanhamento
    expect(result.stems.other?.isAccompanimentLayer).toBe(true);
    expect(result.stems.other?.stemType).toBe('other');
  });

  it('Rejeita e invalida categorização indevida do stem "other" como guitarra isolada', () => {
    const invalidStems: Record<'drums' | 'bass' | 'vocals' | 'other', StemTrackInfo> = {
      drums: {
        stemType: 'drums',
        label: 'Drums',
        description: 'Drums',
        sampleRate: 44100,
        channels: 2,
        durationSeconds: 10,
        rmsLevel: 0.2,
        peakLevel: 0.8,
        isAccompanimentLayer: false,
      },
      bass: {
        stemType: 'bass',
        label: 'Bass',
        description: 'Bass',
        sampleRate: 44100,
        channels: 2,
        durationSeconds: 10,
        rmsLevel: 0.2,
        peakLevel: 0.8,
        isAccompanimentLayer: false,
      },
      vocals: {
        stemType: 'vocals',
        label: 'Vocals',
        description: 'Vocals',
        sampleRate: 44100,
        channels: 2,
        durationSeconds: 10,
        rmsLevel: 0.2,
        peakLevel: 0.8,
        isAccompanimentLayer: false,
      },
      other: {
        stemType: 'other',
        label: 'Guitarra Isolada Primária', // VIOLAÇÃO: Rotulando stem other como guitarra isolada
        description: 'Engano taxonômico',
        sampleRate: 44100,
        channels: 2,
        durationSeconds: 10,
        rmsLevel: 0.2,
        peakLevel: 0.8,
        isAccompanimentLayer: false,
      },
    };

    const validation = validateStemsIntegrity(invalidStems);
    expect(validation.accompanimentDistinctionVerified).toBe(false);
    expect(validation.issues.some((i) => i.includes('Violação de Taxonomia Musical'))).toBe(true);
  });
});
