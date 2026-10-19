// src/engine/stemsMixer.ts
// Ontabs Multi-Track Stems Mixer
// Mixer de 4+ canais para reprodução sincronizada de stems com Solo, Mute, Volume e Pan estéreo.

export type StemType = 'vocals' | 'drums' | 'bass' | 'other' | 'mix';

export interface StemChannelState {
  id: StemType;
  name: string;
  url?: string;
  volume: number; // 0..1 (default 1)
  pan: number; // -1..1 (default 0)
  muted: boolean;
  solo: boolean;
  loaded: boolean;
}

export const DEFAULT_STEM_CHANNELS: StemChannelState[] = [
  { id: 'vocals', name: 'Voz (Vocals)', volume: 1.0, pan: 0, muted: false, solo: false, loaded: false },
  { id: 'drums', name: 'Bateria (Drums)', volume: 1.0, pan: 0, muted: false, solo: false, loaded: false },
  { id: 'bass', name: 'Baixo (Bass)', volume: 1.0, pan: 0, muted: false, solo: false, loaded: false },
  { id: 'other', name: 'Instrumental / Guitarras (Other)', volume: 1.0, pan: 0, muted: false, solo: false, loaded: false },
  { id: 'mix', name: 'Mix Original', volume: 1.0, pan: 0, muted: false, solo: false, loaded: false },
];

/**
 * Calcula os ganhos efetivos de cada canal considerando lógica de Solo e Mute.
 */
export function calculateEffectiveChannelGains(channels: StemChannelState[]): Record<StemType, number> {
  const hasSolo = channels.some((c) => c.solo);
  const result: Record<StemType, number> = {
    vocals: 0,
    drums: 0,
    bass: 0,
    other: 0,
    mix: 0,
  };

  for (const c of channels) {
    if (c.muted) {
      result[c.id] = 0;
    } else if (hasSolo) {
      result[c.id] = c.solo ? c.volume : 0;
    } else {
      result[c.id] = c.volume;
    }
  }

  return result;
}

export class StemsMixer {
  private channels: Map<StemType, StemChannelState> = new Map();

  constructor() {
    DEFAULT_STEM_CHANNELS.forEach((c) => {
      this.channels.set(c.id, { ...c });
    });
  }

  public getChannel(id: StemType): StemChannelState | undefined {
    return this.channels.get(id);
  }

  public getAllChannels(): StemChannelState[] {
    return Array.from(this.channels.values());
  }

  public setVolume(id: StemType, volume: number): void {
    const ch = this.channels.get(id);
    if (ch) ch.volume = Math.max(0, Math.min(1, volume));
  }

  public setPan(id: StemType, pan: number): void {
    const ch = this.channels.get(id);
    if (ch) ch.pan = Math.max(-1, Math.min(1, pan));
  }

  public toggleMute(id: StemType): boolean {
    const ch = this.channels.get(id);
    if (!ch) return false;
    ch.muted = !ch.muted;
    return ch.muted;
  }

  public toggleSolo(id: StemType): boolean {
    const ch = this.channels.get(id);
    if (!ch) return false;
    ch.solo = !ch.solo;
    return ch.solo;
  }

  public resetAll(): void {
    this.channels.forEach((ch) => {
      ch.volume = 1.0;
      ch.pan = 0;
      ch.muted = false;
      ch.solo = false;
    });
  }

  public getEffectiveGains(): Record<StemType, number> {
    return calculateEffectiveChannelGains(this.getAllChannels());
  }
}
