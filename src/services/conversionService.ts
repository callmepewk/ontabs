// src/services/conversionService.ts
//
// NÃO IMPLEMENTADO — esta é a arquitetura de integração futura para o
// principal diferencial do OnTabs (música → tablatura). Propositalmente
// não há nenhuma detecção de nota real aqui: chamar `convert()` hoje lança
// um erro claro em vez de fingir um resultado.
//
// Quando o pipeline real existir (upload → processamento → análise musical
// → detecção de notas → tablatura), implemente ConversionService de verdade
// e troque a instância exportada no fim do arquivo.

import { Instrument, Tab } from '@/types/domain';

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
  startConversion(songId: string, instrument: Instrument): Promise<ConversionJob>;
  getJobStatus(jobId: string): Promise<ConversionJob | null>;
}

class NotImplementedConversionService implements ConversionService {
  async startConversion(): Promise<ConversionJob> {
    throw new Error(
      'Conversão de música para tablatura ainda não foi implementada. ' +
      'Esta chamada existe apenas como contrato de arquitetura para a integração futura.'
    );
  }

  async getJobStatus(): Promise<ConversionJob | null> {
    throw new Error('Conversão de música para tablatura ainda não foi implementada.');
  }
}

export const conversionService: ConversionService = new NotImplementedConversionService();

// Helper usado pela UI do Converter para exibir os passos do pipeline
// mesmo antes de existir implementação real por trás.
export const CONVERSION_PIPELINE_STEPS: { stage: ConversionStage; label: string }[] = [
  { stage: 'queued', label: 'Fonte da música' },
  { stage: 'processing_audio', label: 'Processamento' },
  { stage: 'analyzing_music', label: 'Análise musical' },
  { stage: 'detecting_notes', label: 'Detecção de notas' },
  { stage: 'generating_tab', label: 'Geração da tablatura' },
];
