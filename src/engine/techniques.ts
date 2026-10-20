// src/engine/techniques.ts
// Catálogo Unificado e Taxonomia de Técnicas de Execução Multi-instrumental (Guitarra, Baixo, Bateria, Saxofone)
// Active Listener — Classificação formal e semântica de articulações e dinâmicas musicais.

import { Instrument } from '@/types/domain';

export type GuitarBassTechnique =
  | 'hammer_on'
  | 'pull_off'
  | 'slide_up'
  | 'slide_down'
  | 'bend'
  | 'pre_bend'
  | 'release_bend'
  | 'vibrato'
  | 'palm_mute'
  | 'natural_harmonic'
  | 'pinch_harmonic'
  | 'slap'
  | 'pop'
  | 'tap'
  | 'ghost_note'
  | 'pick_scrape';

export type DrumArticulation =
  | 'hit'
  | 'rimshot'
  | 'sidestick'
  | 'choke'
  | 'accent'
  | 'ghost'
  | 'roll'
  | 'flam'
  | 'drag';

export type DrumPiece =
  | 'kick'
  | 'snare'
  | 'hihat_closed'
  | 'hihat_open'
  | 'hihat_pedal'
  | 'tom_high'
  | 'tom_mid'
  | 'tom_floor'
  | 'crash_1'
  | 'crash_2'
  | 'ride_bow'
  | 'ride_bell'
  | 'china'
  | 'splash';

export type SaxophoneTechnique =
  | 'normal'
  | 'subtone'
  | 'growl'
  | 'vibrato'
  | 'bend'
  | 'trill'
  | 'slap_tongue'
  | 'altissimo'
  | 'flutter_tongue'
  | 'fall';

export type AnyMusicalTechnique = GuitarBassTechnique | DrumArticulation | SaxophoneTechnique;

export interface TechniqueDefinition {
  id: AnyMusicalTechnique;
  name: string;
  category: 'fret_articulation' | 'dynamics' | 'harmonic' | 'percussive' | 'embouchure' | 'drum_stroke';
  notationSymbol: string;
  tabSymbol: string;
  instruments: Instrument[];
  acousticSignature: string;
}

export const TECHNIQUE_CATALOG: Record<string, TechniqueDefinition> = {
  // --- Guitarra e Baixo ---
  hammer_on: {
    id: 'hammer_on',
    name: 'Hammer-On',
    category: 'fret_articulation',
    notationSymbol: '⌢',
    tabSymbol: 'h',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar', 'bass', 'ukulele'],
    acousticSignature: 'Aumento de pitch legato sem ataque transiente de palheta/dedo',
  },
  pull_off: {
    id: 'pull_off',
    name: 'Pull-Off',
    category: 'fret_articulation',
    notationSymbol: '⌣',
    tabSymbol: 'p',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar', 'bass', 'ukulele'],
    acousticSignature: 'Decréscimo de pitch legato sem ataque transiente de palheta/dedo',
  },
  slide_up: {
    id: 'slide_up',
    name: 'Slide Up',
    category: 'fret_articulation',
    notationSymbol: '╱',
    tabSymbol: '/',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar', 'bass', 'ukulele'],
    acousticSignature: 'Transição espectral contínua e ascendente com harmônicos mantidos',
  },
  slide_down: {
    id: 'slide_down',
    name: 'Slide Down',
    category: 'fret_articulation',
    notationSymbol: '╲',
    tabSymbol: '\\',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar', 'bass', 'ukulele'],
    acousticSignature: 'Transição espectral contínua e descendente com harmônicos mantidos',
  },
  bend: {
    id: 'bend',
    name: 'Bend (Bend de Corda)',
    category: 'fret_articulation',
    notationSymbol: '⤴',
    tabSymbol: 'b',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar', 'bass'],
    acousticSignature: 'Elevação contínua da F0 de 0.5 a 2.5 semitons sem troca de traste',
  },
  release_bend: {
    id: 'release_bend',
    name: 'Release Bend',
    category: 'fret_articulation',
    notationSymbol: '⤵',
    tabSymbol: 'r',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar'],
    acousticSignature: 'Retorno contínuo da afinação flexionada ao tom de repouso',
  },
  vibrato: {
    id: 'vibrato',
    name: 'Vibrato',
    category: 'fret_articulation',
    notationSymbol: '〰',
    tabSymbol: '~',
    instruments: ['guitar', 'lead_guitar', 'acoustic_guitar', 'bass', 'saxophone', 'alto_sax', 'tenor_sax'],
    acousticSignature: 'Modulação periódica de F0 (4 Hz a 7 Hz, amplitude 15 a 60 cents)',
  },
  palm_mute: {
    id: 'palm_mute',
    name: 'Palm Mute',
    category: 'dynamics',
    notationSymbol: 'P.M.',
    tabSymbol: 'PM',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar', 'bass'],
    acousticSignature: 'Amortecimento rápido de frequências altas e decaimento acelerado',
  },
  natural_harmonic: {
    id: 'natural_harmonic',
    name: 'Harmônico Natural',
    category: 'harmonic',
    notationSymbol: '◇',
    tabSymbol: '<N>',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar', 'bass'],
    acousticSignature: 'Espectro senoidal puro ressoando nos nós fracionários (1/2, 1/3, 1/4)',
  },
  pinch_harmonic: {
    id: 'pinch_harmonic',
    name: 'Pinch Harmonic (Harmônico Artificial)',
    category: 'harmonic',
    notationSymbol: '◆',
    tabSymbol: '<P>',
    instruments: ['guitar', 'lead_guitar'],
    acousticSignature: 'Ressonância intensa em harmônico ímpar elevado com ruído de palheta',
  },
  slap: {
    id: 'slap',
    name: 'Slap (Polegar)',
    category: 'percussive',
    notationSymbol: 'S',
    tabSymbol: 'S',
    instruments: ['bass'],
    acousticSignature: 'Ataque percussivo brilhante no contato da corda contra o traste',
  },
  pop: {
    id: 'pop',
    name: 'Pop (Puxada)',
    category: 'percussive',
    notationSymbol: 'P',
    tabSymbol: 'P',
    instruments: ['bass'],
    acousticSignature: 'Snap agudo e rápido provocado pelo descolamento da corda estalada',
  },
  ghost_note: {
    id: 'ghost_note',
    name: 'Nota Fantasma (Dead Note)',
    category: 'percussive',
    notationSymbol: '×',
    tabSymbol: 'x',
    instruments: ['guitar', 'lead_guitar', 'rhythm_guitar', 'bass', 'drums'],
    acousticSignature: 'Ruído de banda larga percussivo sem pitch tonal definido',
  },

  // --- Saxofone ---
  subtone: {
    id: 'subtone',
    name: 'Subtone',
    category: 'embouchure',
    notationSymbol: 'sub',
    tabSymbol: 'sub',
    instruments: ['saxophone', 'alto_sax', 'tenor_sax'],
    acousticSignature: 'Atenuação harmônica suave com presença pronunciada de sopro aéreo',
  },
  growl: {
    id: 'growl',
    name: 'Growl',
    category: 'embouchure',
    notationSymbol: 'grw',
    tabSymbol: 'grw',
    instruments: ['saxophone', 'alto_sax', 'tenor_sax'],
    acousticSignature: 'Modulação de intermodulação rouca gerada pela garganta simultânea ao sopro',
  },
  altissimo: {
    id: 'altissimo',
    name: 'Altissimo',
    category: 'embouchure',
    notationSymbol: '8va',
    tabSymbol: 'alt',
    instruments: ['saxophone', 'alto_sax', 'tenor_sax'],
    acousticSignature: 'Registro ultra-agudo além da tessitura mecânica padrão com digitações especiais',
  },

  // --- Bateria ---
  rimshot: {
    id: 'rimshot',
    name: 'Rimshot',
    category: 'drum_stroke',
    notationSymbol: 'RIM',
    tabSymbol: 'rim',
    instruments: ['drums'],
    acousticSignature: 'Impacto simultâneo no aro e na esteira da caixa gerando alto SPL cortante',
  },
  sidestick: {
    id: 'sidestick',
    name: 'Sidestick (Cross-stick)',
    category: 'drum_stroke',
    notationSymbol: 'X',
    tabSymbol: 'ss',
    instruments: ['drums'],
    acousticSignature: 'Golpe seco de madeira contra metal em frequências médias/altas isoladas',
  },
  choke: {
    id: 'choke',
    name: 'Prato Abafado (Choke)',
    category: 'drum_stroke',
    notationSymbol: '+',
    tabSymbol: 'chk',
    instruments: ['drums'],
    acousticSignature: 'Corte abrupto do decaimento do prato de ataque por preensão manual',
  },
};

/**
 * Valida se uma determinada técnica é permitida para o instrumento especificado.
 */
export function isTechniqueAllowed(instrument: Instrument, techniqueId: string): boolean {
  const def = TECHNIQUE_CATALOG[techniqueId];
  if (!def) return false;
  return def.instruments.includes(instrument);
}

/**
 * Retorna o símbolo de tablatura canônico de uma técnica.
 */
export function getTechniqueTabSymbol(techniqueId: string): string {
  return TECHNIQUE_CATALOG[techniqueId]?.tabSymbol ?? '';
}

export interface TrajectoryPoint {
  time: number; // segundos
  midi: number;
  clarity: number; // 0..1
}

export interface TrajectoryAnalysisResult {
  detectedTechniques: GuitarBassTechnique[];
  pitchDriftSemitones: number;
  vibratoDetected: boolean;
  vibratoRateHz?: number;
  vibratoDepthCents?: number;
}

/**
 * Analisa uma trajetória temporal de F0 (Active Listener) para detectar vibrato, bends e slides.
 * Algoritmo puramente matemático e determinístico.
 */
export function analyzePitchTrajectory(points: TrajectoryPoint[]): TrajectoryAnalysisResult {
  if (points.length < 3) {
    return {
      detectedTechniques: [],
      pitchDriftSemitones: 0,
      vibratoDetected: false,
    };
  }

  const validPoints = points.filter((p) => p.clarity > 0.6);
  if (validPoints.length < 3) {
    return {
      detectedTechniques: [],
      pitchDriftSemitones: 0,
      vibratoDetected: false,
    };
  }

  const firstPitch = validPoints[0].midi;
  const lastPitch = validPoints[validPoints.length - 1].midi;
  const pitchDrift = lastPitch - firstPitch;
  const detected: GuitarBassTechnique[] = [];

  // 1. Detecção de Bend (elevação progressiva sem corte)
  if (pitchDrift >= 0.8 && pitchDrift <= 3.2) {
    detected.push('bend');
  } else if (pitchDrift <= -0.8 && pitchDrift >= -3.2) {
    detected.push('release_bend');
  }

  // 2. Detecção de Slide (mudança monótona de 3+ semitons ou traste contínuo)
  if (Math.abs(pitchDrift) >= 2.8) {
    if (pitchDrift > 0) detected.push('slide_up');
    else detected.push('slide_down');
  }

  // 3. Detecção de Vibrato: análise de cruzes de média (zero-crossings da oscilação)
  const avgMidi = validPoints.reduce((acc, p) => acc + p.midi, 0) / validPoints.length;
  const deviations = validPoints.map((p) => p.midi - avgMidi);

  let zeroCrossings = 0;
  for (let i = 1; i < deviations.length; i++) {
    if ((deviations[i - 1] < 0 && deviations[i] >= 0) || (deviations[i - 1] > 0 && deviations[i] <= 0)) {
      zeroCrossings++;
    }
  }

  const duration = validPoints[validPoints.length - 1].time - validPoints[0].time;
  let vibratoDetected = false;
  let vibratoRateHz: number | undefined;
  let vibratoDepthCents: number | undefined;

  if (duration >= 0.25 && zeroCrossings >= 3) {
    const estimatedFreq = (zeroCrossings / 2) / duration;
    // Vibrato musical padrão entre 4.0 Hz e 8.0 Hz
    if (estimatedFreq >= 3.5 && estimatedFreq <= 8.5) {
      const maxDev = Math.max(...deviations.map((d) => Math.abs(d)));
      const cents = maxDev * 100;
      if (cents >= 15 && cents <= 120) {
        vibratoDetected = true;
        vibratoRateHz = Math.round(estimatedFreq * 10) / 10;
        vibratoDepthCents = Math.round(cents);
        detected.push('vibrato');
      }
    }
  }

  return {
    detectedTechniques: detected,
    pitchDriftSemitones: Math.round(pitchDrift * 100) / 100,
    vibratoDetected,
    vibratoRateHz,
    vibratoDepthCents,
  };
}
