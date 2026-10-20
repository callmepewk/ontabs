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

/**
 * Sanitiza o ganho do equalizador prevenindo NaN, Infinity e valores fora de [-12, +12] dB.
 */
export function sanitizeEqualizerGain(gainDb: number): number {
  if (typeof gainDb !== 'number' || isNaN(gainDb) || !isFinite(gainDb)) {
    return 0;
  }
  return Math.max(-12, Math.min(12, gainDb));
}

/**
 * Calcula a resposta em magnitude (dB) de um filtro biquad em uma dada frequência de teste
 * com base nas equações canônicas do RBJ Audio EQ Cookbook.
 */
export function computeBiquadMagnitudeResponse(
  type: BiquadFilterType,
  f0: number,
  gainDb: number,
  q = 1.0,
  testFreq: number,
  sampleRate = 44100
): number {
  const safeGain = sanitizeEqualizerGain(gainDb);
  if (testFreq <= 0 || sampleRate <= 0) return 0;
  if (safeGain === 0) return 0;

  const w0 = (2 * Math.PI * f0) / sampleRate;
  const A = Math.pow(10, safeGain / 40); // 10^(dB / 40)
  const alpha = Math.sin(w0) / (2 * Math.max(0.001, q));

  let b0 = 1, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;

  if (type === 'peaking') {
    b0 = 1 + alpha * A;
    b1 = -2 * Math.cos(w0);
    b2 = 1 - alpha * A;
    a0 = 1 + alpha / A;
    a1 = -2 * Math.cos(w0);
    a2 = 1 - alpha / A;
  } else if (type === 'lowshelf') {
    const sqrtA = Math.sqrt(A);
    b0 = A * (A + 1 - (A - 1) * Math.cos(w0) + 2 * sqrtA * alpha);
    b1 = 2 * A * (A - 1 - (A + 1) * Math.cos(w0));
    b2 = A * (A + 1 - (A - 1) * Math.cos(w0) - 2 * sqrtA * alpha);
    a0 = A + 1 + (A - 1) * Math.cos(w0) + 2 * sqrtA * alpha;
    a1 = -2 * (A - 1 + (A + 1) * Math.cos(w0));
    a2 = A + 1 + (A - 1) * Math.cos(w0) - 2 * sqrtA * alpha;
  } else if (type === 'highshelf') {
    const sqrtA = Math.sqrt(A);
    b0 = A * (A + 1 + (A - 1) * Math.cos(w0) + 2 * sqrtA * alpha);
    b1 = -2 * A * (A - 1 + (A + 1) * Math.cos(w0));
    b2 = A * (A + 1 + (A - 1) * Math.cos(w0) - 2 * sqrtA * alpha);
    a0 = A + 1 - (A - 1) * Math.cos(w0) + 2 * sqrtA * alpha;
    a1 = 2 * (A - 1 - (A + 1) * Math.cos(w0));
    a2 = A + 1 - (A - 1) * Math.cos(w0) - 2 * sqrtA * alpha;
  }

  // Avaliação H(e^{j w}) em testFreq
  const w = (2 * Math.PI * testFreq) / sampleRate;
  const cosW = Math.cos(w);
  const cos2W = Math.cos(2 * w);
  const sinW = Math.sin(w);
  const sin2W = Math.sin(2 * w);

  const numReal = b0 + b1 * cosW + b2 * cos2W;
  const numImag = -(b1 * sinW + b2 * sin2W);
  const denReal = a0 + a1 * cosW + a2 * cos2W;
  const denImag = -(a1 * sinW + a2 * sin2W);

  const numMagSq = numReal * numReal + numImag * numImag;
  const denMagSq = denReal * denReal + denImag * denImag;

  if (denMagSq <= 1e-12) return 0;
  const mag = Math.sqrt(numMagSq / denMagSq);
  return Number((20 * Math.log10(Math.max(1e-6, mag))).toFixed(2));
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
    const clamped = sanitizeEqualizerGain(gainDb);
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
