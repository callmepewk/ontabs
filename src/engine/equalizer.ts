// src/engine/equalizer.ts
// Ontabs Parametric & Graphic 5-Band Equalizer
// Processamento real por nós BiquadFilter da Web Audio API com presets otimizados para estudo musical.

export interface EqualizerBandConfig {
  frequency: number; // Hz
  type: BiquadFilterType;
  label: string;
  defaultGain: number; // dB
  q?: number;
}

export const EQUALIZER_BANDS: EqualizerBandConfig[] = [
  { frequency: 80, type: 'lowshelf', label: 'Sub/Graves (80Hz)', defaultGain: 0 },
  { frequency: 300, type: 'peaking', label: 'Médios Graves (300Hz)', defaultGain: 0, q: 1.0 },
  { frequency: 1000, type: 'peaking', label: 'Médios (1kHz)', defaultGain: 0, q: 1.0 },
  { frequency: 3500, type: 'peaking', label: 'Médios Agudos (3.5kHz)', defaultGain: 0, q: 1.2 },
  { frequency: 8000, type: 'highshelf', label: 'Agudos/Ar (8kHz)', defaultGain: 0 },
];

export interface EqualizerPreset {
  id: string;
  name: string;
  description: string;
  gains: [number, number, number, number, number]; // dB para cada uma das 5 bandas
}

export const EQUALIZER_PRESETS: Record<string, EqualizerPreset> = {
  flat: {
    id: 'flat',
    name: 'Neutro (Flat)',
    description: 'Resposta plana sem coloração espectral.',
    gains: [0, 0, 0, 0, 0],
  },
  guitar_clarity: {
    id: 'guitar_clarity',
    name: 'Clareza de Guitarra',
    description: 'Atenua graves profundos e destaca o ataque e presença das palhetadas.',
    gains: [-3, 0, 2, 4, 1],
  },
  bass_definition: {
    id: 'bass_definition',
    name: 'Definição de Baixo',
    description: 'Enfatiza a fundamental grave e o peso rítmico, reduzindo sibilância.',
    gains: [5, 3, -1, -2, -4],
  },
  vocal_cut: {
    id: 'vocal_cut',
    name: 'Atenuação Vocal (Estudo Instrumental)',
    description: 'Reduz a região média central da voz para destacar a linha instrumental.',
    gains: [0, -1, -6, -4, 0],
  },
  acoustic_warmth: {
    id: 'acoustic_warmth',
    name: 'Calor de Violão',
    description: 'Ressonância encorpada para cordas de nylon e brilho nas cordas de aço.',
    gains: [2, 3, -1, 1, 3],
  },
  study_isolation: {
    id: 'study_isolation',
    name: 'Modo Prática Concentrada',
    description: 'Corte nas extremidades e foco cirúrgico na faixa melódica fundamental.',
    gains: [-4, 1, 4, 3, -2],
  },
};

/**
 * Gráfico de nós BiquadFilter para inserção no fluxo da Web Audio API.
 */
export class EqualizerNodeGraph {
  public inputNode: GainNode;
  public outputNode: GainNode;
  public filters: BiquadFilterNode[] = [];
  private gains: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  constructor(public readonly ctx: AudioContext) {
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();

    let prevNode: AudioNode = this.inputNode;

    for (let i = 0; i < EQUALIZER_BANDS.length; i++) {
      const cfg = EQUALIZER_BANDS[i];
      const filter = ctx.createBiquadFilter();
      filter.type = cfg.type;
      filter.frequency.value = cfg.frequency;
      filter.gain.value = cfg.defaultGain;
      if (cfg.q !== undefined) filter.Q.value = cfg.q;

      prevNode.connect(filter);
      prevNode = filter;
      this.filters.push(filter);
    }

    prevNode.connect(this.outputNode);
  }

  public setBandGain(bandIndex: number, gainDb: number): void {
    if (bandIndex < 0 || bandIndex >= this.filters.length) return;
    const clamped = Math.max(-12, Math.min(12, gainDb));
    this.gains[bandIndex] = clamped;
    this.filters[bandIndex].gain.value = clamped;
  }

  public applyPreset(presetId: string): boolean {
    const preset = EQUALIZER_PRESETS[presetId];
    if (!preset) return false;

    preset.gains.forEach((g, idx) => {
      this.setBandGain(idx, g);
    });
    return true;
  }

  public getGains(): [number, number, number, number, number] {
    return [...this.gains];
  }

  public reset(): void {
    this.applyPreset('flat');
  }
}
