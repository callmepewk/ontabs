// ontabs-play/audioEngine.ts
// Wrapper de Web Audio API. Fonte única da verdade para o tempo de reprodução
// (o GameEngine sincroniza as notas em cima de getCurrentTime(), nunca de um timer próprio).

export interface LoopRegion {
  start: number; // segundos
  end: number;   // segundos
}

export class AudioEngine {
  private ctx: AudioContext;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;

  private ctxStartTime = 0;   // ctx.currentTime no momento em que a source começou
  private startOffset = 0;    // posição (s) dentro do buffer em que a source começou
  private rate = 1;
  private playing = false;
  private loop: LoopRegion | null = null;

  onEnded: (() => void) | null = null;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  async load(url: string): Promise<void> {
    if (url === 'synthetic' || url.startsWith('demo://')) {
      this.generateSyntheticDemoTrack(60);
      return;
    }
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
  }

  /**
   * Gera uma faixa de áudio harmônica sintetizada (Canon em Ré) via Web Audio nativo.
   * Permite que qualquer usuário jogue o OnTabs Play de imediato sem upload prévio de MP3.
   */
  generateSyntheticDemoTrack(durationSeconds = 60): void {
    const sampleRate = this.ctx.sampleRate || 44100;
    const totalSamples = Math.floor(sampleRate * durationSeconds);
    const buffer = this.ctx.createBuffer(2, totalSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Progressão Canon: D4 (293.66), A3 (220), B3 (246.94), F#3 (185), G3 (196), D3 (146.83), G3 (196), A3 (220)
    const chords = [
      [293.66, 369.99, 440.0], // D (D4, F#4, A4)
      [220.0, 277.18, 329.63], // A (A3, C#4, E4)
      [246.94, 293.66, 369.99], // Bm (B3, D4, F#4)
      [185.0, 220.0, 277.18],  // F#m (F#3, A3, C#4)
      [196.0, 246.94, 293.66], // G (G3, B3, D4)
      [146.83, 220.0, 293.66], // D (D3, A3, D4)
      [196.0, 246.94, 329.63], // Em (E3, G3, B3)
      [220.0, 277.18, 329.63], // A (A3, C#4, E4)
    ];

    const chordDuration = 2.0; // 2 segundos por acorde (120 BPM)
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const chordIdx = Math.floor(t / chordDuration) % chords.length;
      const chord = chords[chordIdx];
      const localT = t % chordDuration;
      const env = Math.exp(-localT * 2.5); // decaimento percussivo dedilhado

      let sample = 0;
      for (const freq of chord) {
        // Fundamental + 2º harmônico
        sample += 0.15 * Math.sin(2 * Math.PI * freq * t) * env;
        sample += 0.05 * Math.sin(2 * Math.PI * (freq * 2) * t) * env;
      }

      left[i] = sample;
      right[i] = sample;
    }

    this.buffer = buffer;
  }

  get durationSeconds(): number {
    return this.buffer?.duration ?? 0;
  }

  private buildSource(): AudioBufferSourceNode {
    if (!this.buffer) throw new Error('AudioEngine: buffer não carregado');
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = this.rate;
    if (this.loop) {
      src.loop = true;
      src.loopStart = this.loop.start;
      src.loopEnd = this.loop.end;
    }
    src.connect(this.gainNode);
    src.onended = () => {
      if (this.playing && !this.loop) {
        this.playing = false;
        this.onEnded?.();
      }
    };
    return src;
  }

  play(offsetSeconds = 0): void {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopInternal();
    this.source = this.buildSource();
    this.startOffset = offsetSeconds;
    this.ctxStartTime = this.ctx.currentTime;
    this.source.start(0, offsetSeconds);
    this.playing = true;
  }

  pause(): void {
    if (!this.playing) return;
    this.startOffset = this.getCurrentTime();
    this.stopInternal();
    this.playing = false;
  }

  resume(): void {
    if (this.playing) return;
    this.play(this.startOffset);
  }

  seek(seconds: number): void {
    const wasPlaying = this.playing;
    this.stopInternal();
    this.startOffset = Math.max(0, seconds);
    if (wasPlaying) this.play(this.startOffset);
  }

  setPlaybackRate(rate: number): void {
    this.rate = rate;
    if (this.source) this.source.playbackRate.value = rate;
  }

  setLoopRegion(start: number, end: number): void {
    this.loop = { start, end };
    if (this.playing) this.seek(start);
  }

  clearLoopRegion(): void {
    this.loop = null;
    if (this.source) this.source.loop = false;
  }

  private stopInternal(): void {
    if (this.source) {
      try {
        this.source.onended = null;
        this.source.stop();
      } catch {
        /* já parado */
      }
      this.source.disconnect();
      this.source = null;
    }
  }

  /** Tempo atual de reprodução em segundos, calculado a partir do relógio do AudioContext. */
  getCurrentTime(): number {
    if (!this.playing) return this.startOffset;
    const elapsed = (this.ctx.currentTime - this.ctxStartTime) * this.rate;
    let t = this.startOffset + elapsed;
    if (this.loop) {
      const len = this.loop.end - this.loop.start;
      if (len > 0 && t > this.loop.end) {
        t = this.loop.start + ((t - this.loop.start) % len);
      }
    }
    return t;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  destroy(): void {
    this.stopInternal();
    this.ctx.close();
  }
}
