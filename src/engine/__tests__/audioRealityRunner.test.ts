// src/engine/__tests__/audioRealityRunner.test.ts
// Testes automatizados do Audio Reality Runner e conformidade de Termos (Gate 0 e Gate 1)

import { describe, it, expect } from 'vitest';
import { runAudioRealityRunner } from '../../../scripts/audioRealityRunner';
import { resolveExternalConnectorUrl } from '../connectors';

describe('Ontabs Audio Reality Runner & Regulatory Compliance (Gate 0 & 1)', () => {
  it('Executa o Audio Reality Runner de ponta a ponta e aprova com status PASS', async () => {
    const report = await runAudioRealityRunner();

    expect(report.overallStatus).toBe('PASS');
    expect(report.trackA_ExternalReference.status).toBe('PASS');
    expect(report.trackB_OperationalAudioPipeline.status).toBe('PASS');

    // Validações do Track A
    expect(report.trackA_ExternalReference.resolvedProvider).toBe('spotify');
    expect(report.trackA_ExternalReference.resolvedId).toBe('1hIQPCM3oWXrpnXmgTDaKG');
    expect(report.trackA_ExternalReference.trackTitle).toBe("Can't You Hear Me Knocking");
    expect(report.trackA_ExternalReference.artist).toBe('The Rolling Stones');
    expect(report.trackA_ExternalReference.accessMode).toBe('METADATA_ONLY');
    expect(report.trackA_ExternalReference.audioStreamAvailable).toBe(false);

    // Validações do Track B
    expect(report.trackB_OperationalAudioPipeline.hasClipping).toBe(false);
    expect(report.trackB_OperationalAudioPipeline.rmsLevel).toBeGreaterThan(0.05);
    expect(report.trackB_OperationalAudioPipeline.stemSeparation.accompanimentDistinctionVerified).toBe(true);
    expect(report.trackB_OperationalAudioPipeline.instrumentAnalysis.electricBass.noteCount).toBeGreaterThan(0);
    expect(report.trackB_OperationalAudioPipeline.instrumentAnalysis.electricGuitar.noteCount).toBeGreaterThan(0);
    expect(report.trackB_OperationalAudioPipeline.collectiveArrangement.doubleGuitarInference.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('Garante conformidade com termos de serviço: Spotify URL localized aceita e restrita a METADATA_ONLY', () => {
    const localizedUrl = 'https://open.spotify.com/intl-pt/track/1hIQPCM3oWXrpnXmgTDaKG?si=ed8a593fc6484792';
    const metadata = resolveExternalConnectorUrl(localizedUrl);

    expect(metadata.provider).toBe('spotify');
    expect(metadata.id).toBe('1hIQPCM3oWXrpnXmgTDaKG');
    expect(metadata.title).toBe("Can't You Hear Me Knocking");
    expect(metadata.artist).toBe('The Rolling Stones');
    expect(metadata.album).toContain('Sticky Fingers');
    expect(metadata.durationSeconds).toBe(435);
    expect(metadata.accessMode).toBe('METADATA_ONLY');
    expect(metadata.audioStreamAvailable).toBe(false);
    expect(metadata.requiresLocalAudio).toBe(true);
    expect(metadata.message).toContain('Termos de Serviço');
  });
});

