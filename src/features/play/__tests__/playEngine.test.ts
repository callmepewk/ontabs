// src/features/play/__tests__/playEngine.test.ts
// Testes unitários formais para o OnTabs Play Engine:
// Janelas de julgamento, combos, multiplicadores, pontuação e ChartGenerator.

import { describe, it, expect, vi } from 'vitest';
import { GameEngine, DEFAULT_TIMING_WINDOWS, STRICT_PRO_WINDOWS } from '../gameEngine';
import { generateGameChart } from '../chartGenerator';
import { GameChart, TabEvent } from '../types';

class MockPlayAudio {
  public time = 0;
  public playing = false;

  getCurrentTime(): number {
    return this.time;
  }
  isPlaying(): boolean {
    return this.playing;
  }
}

describe('OnTabs Play - GameEngine Timing Windows & Judgment', () => {
  const createTestChart = (): GameChart => ({
    songId: 'test_song',
    title: 'Test Song',
    artist: 'Test Artist',
    bpm: 120,
    laneCount: 5,
    difficulty: 'medium',
    durationSeconds: 10,
    notes: [
      { id: 'n1', timestamp: 1.0, lane: 0, type: 'note' },
      { id: 'n2', timestamp: 2.0, lane: 1, type: 'note' },
      { id: 'n3', timestamp: 3.0, lane: 2, type: 'note' },
      { id: 'n4', timestamp: 4.0, lane: 3, type: 'note' },
    ],
  });

  it('classifica Perfect dentro da janela padrão (<= 35ms)', () => {
    expect(DEFAULT_TIMING_WINDOWS.perfectMs).toBe(35);
    const audio = new MockPlayAudio();
    const engine = new GameEngine(createTestChart(), audio);

    // Hit na lane 0 exatamente em 1.020s (20ms de diferença) -> Perfect
    const result = engine.hitLane(0, 1.02);
    expect(result).not.toBeNull();
    expect(result?.judgement).toBe('perfect');
    expect(result?.deltaMs).toBeCloseTo(20, 1);

    const stats = engine.getStats();
    expect(stats.perfect).toBe(1);
    expect(stats.combo).toBe(1);
    expect(stats.score).toBe(100); // 100 * 1x
    expect(stats.accuracy).toBe(100);
  });

  it('classifica Great entre 36ms e 70ms', () => {
    const audio = new MockPlayAudio();
    const engine = new GameEngine(createTestChart(), audio);

    // Hit na lane 0 em 1.050s (50ms de diferença) -> Great
    const result = engine.hitLane(0, 1.05);
    expect(result?.judgement).toBe('great');
    const stats = engine.getStats();
    expect(stats.great).toBe(1);
    expect(stats.score).toBe(70);
  });

  it('classifica Good entre 71ms e 120ms', () => {
    const audio = new MockPlayAudio();
    const engine = new GameEngine(createTestChart(), audio);

    // Hit na lane 0 em 1.095s (95ms de diferença) -> Good
    const result = engine.hitLane(0, 1.095);
    expect(result?.judgement).toBe('good');
    const stats = engine.getStats();
    expect(stats.good).toBe(1);
    expect(stats.score).toBe(40);
  });

  it('ignora toque prematuro fora da janela máxima de hit (> 160ms)', () => {
    const audio = new MockPlayAudio();
    const engine = new GameEngine(createTestChart(), audio);

    // Tenta tocar em 0.700s (300ms antes de 1.0s) -> Fora da janela, ignora
    const result = engine.hitLane(0, 0.7);
    expect(result).toBeNull();
    expect(engine.getStats().judged).toBe(0);
  });

  it('registra Miss automático quando a nota ultrapassa a janela de miss no tick', () => {
    const audio = new MockPlayAudio();
    const onHitMock = vi.fn();
    const engine = new GameEngine(createTestChart(), audio, { onHit: onHitMock });

    // Tick em 1.250s (250ms após a nota de 1.0s, ultrapassando missMs=160ms)
    engine.tick(1.25);

    const stats = engine.getStats();
    expect(stats.miss).toBe(1);
    expect(stats.combo).toBe(0);
    expect(stats.accuracy).toBe(0);
    expect(onHitMock).toHaveBeenCalledWith(
      expect.objectContaining({ judgement: 'miss', noteId: 'n1' }),
      expect.anything()
    );
  });

  it('respeita janelas estritas Pro configuradas (Perfect <= 25ms, Great <= 50ms)', () => {
    const audio = new MockPlayAudio();
    const engine = new GameEngine(createTestChart(), audio, {}, STRICT_PRO_WINDOWS);

    // Diferença de 30ms: em modo padrão seria Perfect (<=35ms), mas no STRICT_PRO vira Great (>25ms)
    const result = engine.hitLane(0, 1.03);
    expect(result?.judgement).toBe('great');
  });
});

describe('OnTabs Play - Combo Multipliers & Scoring Progression', () => {
  it('avança multiplicadores: 1x (0-9), 2x (10-19), 3x (20-29), 4x (30+)', () => {
    // Cria um chart com 35 notas sequenciais
    const notes = Array.from({ length: 35 }, (_, i) => ({
      id: `n${i}`,
      timestamp: i * 0.5 + 0.5,
      lane: 0,
      type: 'note' as const,
    }));
    const chart: GameChart = {
      songId: 's_combo',
      title: 'Combo Test',
      artist: 'Combo Artist',
      bpm: 120,
      laneCount: 5,
      difficulty: 'expert',
      durationSeconds: 20,
      notes,
    };

    const audio = new MockPlayAudio();
    const engine = new GameEngine(chart, audio);

    // Toca as primeiras 9 notas perfeitas
    for (let i = 0; i < 9; i++) {
      engine.hitLane(0, notes[i].timestamp);
    }
    expect(engine.getStats().combo).toBe(9);
    expect(engine.getStats().multiplier).toBe(1);

    // 10ª nota -> Multiplicador sobe para 2x
    engine.hitLane(0, notes[9].timestamp);
    expect(engine.getStats().combo).toBe(10);
    expect(engine.getStats().multiplier).toBe(2);

    // Toca até a 19ª nota
    for (let i = 10; i < 20; i++) {
      engine.hitLane(0, notes[i].timestamp);
    }
    expect(engine.getStats().combo).toBe(20);
    expect(engine.getStats().multiplier).toBe(3);

    // Toca até a 30ª nota -> Multiplicador sobe para 4x
    for (let i = 20; i < 30; i++) {
      engine.hitLane(0, notes[i].timestamp);
    }
    expect(engine.getStats().combo).toBe(30);
    expect(engine.getStats().multiplier).toBe(4);

    // Miss na 31ª nota: zera combo e volta multiplicador para 1x
    engine.tick(notes[30].timestamp + 0.3);
    expect(engine.getStats().combo).toBe(0);
    expect(engine.getStats().multiplier).toBe(1);
    expect(engine.getStats().maxCombo).toBe(30);
  });
});

describe('OnTabs Play - ChartGenerator Provenance', () => {
  it('gera GameChart determinístico e preserva acordes em modo Expert', () => {
    const tabEvents: TabEvent[] = [
      { timestamp: 0.5, strings: [1] },
      { timestamp: 1.0, strings: [1, 2] }, // Acorde
      { timestamp: 1.5, strings: [3], sustainMs: 600 }, // Sustain
    ];

    const chart = generateGameChart(tabEvents, {
      songId: 'canon_prov',
      title: 'Canon Test',
      artist: 'JerryC',
      bpm: 130,
      laneCount: 5,
      difficulty: 'expert',
      durationSeconds: 10,
    });

    expect(chart.notes).toHaveLength(3);
    expect(chart.notes[0].type).toBe('note');
    expect(chart.notes[1].type).toBe('chord');
    expect(chart.notes[1].lanes).toHaveLength(2);
    expect(chart.notes[2].type).toBe('sustain');
    expect(chart.notes[2].duration).toBe(600);
  });

  it('simplifica acordes para notas únicas em modo Easy', () => {
    const tabEvents: TabEvent[] = [
      { timestamp: 0.5, strings: [1, 2, 3] }, // Power chord / tríade
    ];

    const chart = generateGameChart(tabEvents, {
      songId: 'canon_easy',
      title: 'Canon Easy',
      artist: 'JerryC',
      bpm: 130,
      laneCount: 5,
      difficulty: 'easy',
      durationSeconds: 10,
    });

    expect(chart.notes[0].type).toBe('note');
    expect(chart.notes[0].lanes).toBeUndefined();
  });
});
