// src/services/conversionService.ts
// Pipeline Real de Conversão de Música para Tablatura
// Execução soberana com análise no navegador e persistência autorizada no backend.

import { Instrument } from '@/types/domain';
import { authService } from './authService';
import { computeEnvelopeAndFlux, estimateBpmFromFlux, estimatePitchAutocorrelation } from '../engine';

export type ConversionStage =
  | 'queued'
  | 'processing_audio'
  | 'analyzing_music'
  | 'detecting_notes'
  | 'generating_tab'
  | 'done'
  | 'error';

export interface ConversionJob {
  id: string;
  songId: string;
  instrument: Instrument;
  stage: ConversionStage;
  progress: number; // 0-100
  resultTabId?: string;
  error?: string;
}

export interface ConversionService {
  startConversion(
    fileOrTitle: File | string,
    instrument: Instrument,
    onProgress?: (stage: ConversionStage, progress: number) => void
  ): Promise<ConversionJob>;
  getJobStatus(jobId: string): Promise<ConversionJob | null>;
}

class SovereignConversionService implements ConversionService {
  private jobs = new Map<string, ConversionJob>();

  async startConversion(
    fileOrTitle: File | string,
    instrument: Instrument = 'guitar',
    onProgress?: (stage: ConversionStage, progress: number) => void
  ): Promise<ConversionJob> {
    const jobId = `job_${Date.now()}`;
    const title = typeof fileOrTitle === 'string' ? fileOrTitle : fileOrTitle.name.replace(/\.[^/.]+$/, '');

    const update = (stage: ConversionStage, progress: number, errorMsg?: string) => {
      const job: ConversionJob = {
        id: jobId,
        songId: '',
        instrument,
        stage,
        progress,
        error: errorMsg,
      };
      this.jobs.set(jobId, job);
      onProgress?.(stage, progress);
    };

    update('queued', 10);

    let detectedBpm = 120;
    let durationSeconds = 60;
    let songKey = 'C';
    const detectedNotes: any[] = [];

    // Validação estrita de arquivos de áudio
    if (typeof fileOrTitle !== 'string') {
      const file = fileOrTitle;
      const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
      if (file.size > MAX_FILE_SIZE) {
        const msg = `O arquivo selecionado (${(file.size / (1024 * 1024)).toFixed(1)}MB) excede o limite máximo permitido de 30MB.`;
        update('error', 100, msg);
        throw new Error(msg);
      }
      if (file.size === 0) {
        const msg = 'O arquivo selecionado está vazio ou corrompido (0 bytes).';
        update('error', 100, msg);
        throw new Error(msg);
      }
    }

    // Se for arquivo de áudio real, processa via Web Audio API no navegador
    if (typeof fileOrTitle !== 'string' && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();

      try {
        update('processing_audio', 30);
        const arrayBuffer = await fileOrTitle.arrayBuffer();
        let audioBuffer: AudioBuffer;

        try {
          audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch {
          throw new Error(
            'Falha na decodificação do áudio. Se for um vídeo MP4, certifique-se de que ele contém uma faixa de áudio compatível (AAC/MP3/PCM).'
          );
        }

        durationSeconds = Math.round(audioBuffer.duration);
        if (durationSeconds > 600) {
          throw new Error('A duração do áudio ultrapassa o limite máximo permitido de 10 minutos (600 segundos).');
        }

        update('analyzing_music', 50);
        // Canal mono
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const { flux, fps } = computeEnvelopeAndFlux(channelData, sampleRate, 512);

        update('detecting_notes', 70);
        const bpmResult = estimateBpmFromFlux(flux, fps);
        detectedBpm = bpmResult.bpm || 120;

        // Amostragem de transientes melódicos e F0 com autocorrelação real
        const beatInterval = 60 / detectedBpm;
        const windowSize = 2048;
        const pitchClassCounts = new Array(12).fill(0);

        for (let t = 0; t < Math.min(durationSeconds, 120); t += beatInterval / 2) {
          const sampleIndex = Math.floor(t * sampleRate);
          if (sampleIndex + windowSize <= channelData.length) {
            const pitch = estimatePitchAutocorrelation(channelData, sampleRate, sampleIndex, windowSize);
            if (pitch && pitch.clarity >= 0.35 && pitch.midi >= 28 && pitch.midi <= 88) {
              detectedNotes.push({
                timestamp: Number(t.toFixed(2)),
                midi: pitch.midi,
                frequency: pitch.frequency,
                cents: pitch.cents,
                clarity: pitch.clarity,
                duration: Number((beatInterval * 0.45).toFixed(2)),
              });
              pitchClassCounts[pitch.midi % 12]++;
            }
          }
        }

        // Determinação da Tonalidade pela nota mais preponderante
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let maxCount = 0;
        let bestRootIdx = 0;
        for (let i = 0; i < 12; i++) {
          if (pitchClassCounts[i] > maxCount) {
            maxCount = pitchClassCounts[i];
            bestRootIdx = i;
          }
        }
        if (maxCount > 0) {
          songKey = noteNames[bestRootIdx];
        }
      } catch (err: any) {
        update('error', 100, err?.message);
        throw err;
      } finally {
        await audioCtx.close();
      }
    } else {
      update('analyzing_music', 50);
      update('detecting_notes', 70);
    }

    update('generating_tab', 85);

    // Comunica com endpoint soberano no servidor
    const token = authService.getToken();
    const visitorId = authService.getVisitorId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Visitor-Id': visitorId,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/music/convert', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        artist: 'Arquivo de Áudio',
        instrument,
        durationSeconds,
        bpm: detectedBpm,
        songKey,
        notes: detectedNotes,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      const job: ConversionJob = {
        id: jobId,
        songId: '',
        instrument,
        stage: 'error',
        progress: 100,
        error: errData.error || 'Erro ao realizar conversão.',
      };
      this.jobs.set(jobId, job);
      throw new Error(job.error);
    }

    const data = await res.json();
    const completedJob: ConversionJob = {
      id: jobId,
      songId: data.song.id,
      instrument,
      stage: 'done',
      progress: 100,
      resultTabId: data.tab.id,
    };

    this.jobs.set(jobId, completedJob);
    onProgress?.('done', 100);
    return completedJob;
  }

  async getJobStatus(jobId: string): Promise<ConversionJob | null> {
    return this.jobs.get(jobId) ?? null;
  }
}

export const conversionService: ConversionService = new SovereignConversionService();

export const CONVERSION_PIPELINE_STEPS: { stage: ConversionStage; label: string }[] = [
  { stage: 'queued', label: 'Fonte da música' },
  { stage: 'processing_audio', label: 'Processamento' },
  { stage: 'analyzing_music', label: 'Análise musical' },
  { stage: 'detecting_notes', label: 'Detecção de notas' },
  { stage: 'generating_tab', label: 'Geração da tablatura' },
];
