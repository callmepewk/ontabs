// src/engine/__tests__/audioAndBand.test.ts
// Testes do Equalizador 5-Bandas, Mixer de Stems e Coordenação de Setlists

import { describe, it, expect } from 'vitest';
import {
  EQUALIZER_BANDS,
  EQUALIZER_PRESETS,
} from '../equalizer';
import {
  StemsMixer,
  calculateEffectiveChannelGains,
  DEFAULT_STEM_CHANNELS,
} from '../stemsMixer';
import {
  createEmptySetlist,
  addSongToSetlist,
  reorderSetlistItems,
  detectTuningTransitions,
} from '../setlists';

describe('Equalizador Paramétrico de 5 Bandas & Presets de Estudo', () => {
  it('Possui exatamente 5 bandas cobrindo sub, graves, médios e agudos', () => {
    expect(EQUALIZER_BANDS.length).toBe(5);
    expect(EQUALIZER_BANDS[0].frequency).toBe(80);
    expect(EQUALIZER_BANDS[1].frequency).toBe(300);
    expect(EQUALIZER_BANDS[2].frequency).toBe(1000);
    expect(EQUALIZER_BANDS[3].frequency).toBe(3500);
    expect(EQUALIZER_BANDS[4].frequency).toBe(8000);
  });

  it('Preset "guitar_clarity" atenua subgraves e destaca médios-agudos (3.5kHz)', () => {
    const preset = EQUALIZER_PRESETS.guitar_clarity;
    expect(preset).toBeDefined();
    expect(preset.gains[0]).toBeLessThan(0); // atenua 80Hz
    expect(preset.gains[3]).toBeGreaterThan(0); // reforça 3.5kHz
  });

  it('Preset "bass_definition" reforça a fundamental grave (80Hz e 300Hz)', () => {
    const preset = EQUALIZER_PRESETS.bass_definition;
    expect(preset.gains[0]).toBeGreaterThan(3);
    expect(preset.gains[1]).toBeGreaterThan(0);
    expect(preset.gains[4]).toBeLessThan(0); // reduz agudos extremos
  });

  it('Preset "vocal_cut" atenua fortemente a região vocal (1kHz)', () => {
    const preset = EQUALIZER_PRESETS.vocal_cut;
    expect(preset.gains[2]).toBeLessThanOrEqual(-6);
  });
});

describe('Mixer de Stems Multicanal (Solo / Mute / Volume / Pan)', () => {
  it('Inicializa com 5 canais padrão (Vocais, Bateria, Baixo, Outros, Mix)', () => {
    const mixer = new StemsMixer();
    const channels = mixer.getAllChannels();
    expect(channels.length).toBe(5);
    expect(channels.some((c) => c.id === 'vocals')).toBe(true);
    expect(channels.some((c) => c.id === 'drums')).toBe(true);
    expect(channels.some((c) => c.id === 'bass')).toBe(true);
  });

  it('Em modo normal sem Solo/Mute, todos os canais possuem ganho proporcional ao volume', () => {
    const channels = [...DEFAULT_STEM_CHANNELS];
    const gains = calculateEffectiveChannelGains(channels);
    expect(gains.vocals).toBe(1.0);
    expect(gains.bass).toBe(1.0);
    expect(gains.drums).toBe(1.0);
  });

  it('Quando um canal está em Solo, apenas os canais em Solo produzem áudio', () => {
    const channels = DEFAULT_STEM_CHANNELS.map((c) => ({ ...c, solo: c.id === 'bass' }));
    const gains = calculateEffectiveChannelGains(channels);
    expect(gains.bass).toBe(1.0);
    expect(gains.vocals).toBe(0);
    expect(gains.drums).toBe(0);
    expect(gains.other).toBe(0);
  });

  it('Canal Muted tem ganho 0 mesmo se estiver marcado com Solo', () => {
    const channels = DEFAULT_STEM_CHANNELS.map((c) => ({
      ...c,
      solo: c.id === 'bass',
      muted: c.id === 'bass',
    }));
    const gains = calculateEffectiveChannelGains(channels);
    expect(gains.bass).toBe(0);
  });
});

describe('Coordenação de Setlist & Repertório de Banda', () => {
  it('Cria setlist vazio com id e timestamps válidos', () => {
    const setlist = createEmptySetlist('Show de Sexta-Feira', 'usr_pedro');
    expect(setlist.name).toBe('Show de Sexta-Feira');
    expect(setlist.items.length).toBe(0);
    expect(setlist.userId).toBe('usr_pedro');
  });

  it('Adiciona música ao setlist com notas de palco e afinação', () => {
    let setlist = createEmptySetlist('Turnê 2026');
    setlist = addSongToSetlist(setlist, {
      songId: 'song_canon',
      title: 'Canon Rock',
      artist: 'JerryC',
      targetInstrument: 'guitar',
      tuning: 'Drop D',
      bpm: 130,
      targetBpm: 130,
      key: 'D',
      stageNotes: 'Entrada direta após a contagem do baterista.',
    });

    expect(setlist.items.length).toBe(1);
    expect(setlist.items[0].tuning).toBe('Drop D');
    expect(setlist.items[0].stageNotes).toContain('contagem do baterista');
  });

  it('Reordena músicas do setlist corretamente', () => {
    let setlist = createEmptySetlist('Ordem do Show');
    setlist = addSongToSetlist(setlist, {
      songId: 's1', title: 'Música 1', artist: 'A1', targetInstrument: 'guitar',
      tuning: 'E Standard', bpm: 120, targetBpm: 120, key: 'A',
    });
    setlist = addSongToSetlist(setlist, {
      songId: 's2', title: 'Música 2', artist: 'A2', targetInstrument: 'guitar',
      tuning: 'E Standard', bpm: 140, targetBpm: 140, key: 'G',
    });

    expect(setlist.items[0].title).toBe('Música 1');
    const reordered = reorderSetlistItems(setlist, 0, 1);
    expect(reordered.items[0].title).toBe('Música 2');
    expect(reordered.items[1].title).toBe('Música 1');
  });

  it('Detecta transições de afinação entre faixas consecutivas', () => {
    let setlist = createEmptySetlist('Show com Troca de Guitarras');
    setlist = addSongToSetlist(setlist, {
      songId: 's1', title: 'Faixa 1', artist: 'Banda', targetInstrument: 'guitar',
      tuning: 'Standard E', bpm: 120, targetBpm: 120, key: 'E',
    });
    setlist = addSongToSetlist(setlist, {
      songId: 's2', title: 'Faixa 2', artist: 'Banda', targetInstrument: 'guitar',
      tuning: 'Drop D', bpm: 140, targetBpm: 140, key: 'D',
    });
    setlist = addSongToSetlist(setlist, {
      songId: 's3', title: 'Faixa 3', artist: 'Banda', targetInstrument: 'guitar',
      tuning: 'Drop D', bpm: 130, targetBpm: 130, key: 'G',
    });

    const transitions = detectTuningTransitions(setlist);
    expect(transitions.length).toBe(1);
    expect(transitions[0].fromSong).toBe('Faixa 1');
    expect(transitions[0].toSong).toBe('Faixa 2');
    expect(transitions[0].fromTuning).toBe('Standard E');
    expect(transitions[0].toTuning).toBe('Drop D');
  });
});
