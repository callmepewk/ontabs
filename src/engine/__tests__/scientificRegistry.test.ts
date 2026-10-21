// src/engine/__tests__/scientificRegistry.test.ts
// Testes de Integridade Científica e Validação do Corpus de 64 Formulações Canônicas
// Autor do Corpus Canônico: Pedro Henrique Brezolin de Freitas (JIMI / OmniCore)

import { describe, it, expect } from 'vitest';
import {
  loadScientificRegistry,
  getFormulationById,
  validateCorpusIntegrity,
} from '../scientificRegistry';
import { frequencyToMidi } from '../notes';
import { estimatePitchAutocorrelation } from '../audioAnalysis';

describe('Ontabs Scientific Formulation Registry & Canonical Corpus Assurance', () => {
  it('Carrega o registro científico e valida metadados autorais de Pedro Henrique Brezolin de Freitas', () => {
    const reg = loadScientificRegistry();
    expect(reg.corpus.author).toBe('Pedro Henrique Brezolin de Freitas');
    expect(reg.corpus.affiliation).toBe('BZN Industries / JIMI OmniCore');
    expect(reg.corpus.consolidationDate).toBe('2026-09-25');
    expect(reg.corpus.governance).toBe('JIMI SIGNS THE ANALYSIS. PEDRO SIGNS THE AUTHORITY.');
    expect(reg.corpus.invariant).toBe('HYPOTHESIS ≠ EMPIRICAL TRUTH | REFORMULATION ≠ AUTHORSHIP TRANSFER');
    expect(reg.corpus.chainOfCustody).toContain('CLAIM → ARTIFACT → REPOSITORY → TEST → RUNTIME');
  });

  it('Valida integridade estrutural e unicidade: exatamente 64 formulações fundacionais sem duplicidades', () => {
    const integrity = validateCorpusIntegrity();
    expect(integrity.valid).toBe(true);
    expect(integrity.totalFoundational).toBe(64);
    expect(integrity.totalDsp).toBe(10);
    expect(integrity.totalProposed).toBe(3);
    expect(integrity.errors).toHaveLength(0);
  });

  it('Verifica a partição em 5 blocos canônicos com limites estritos', () => {
    const reg = loadScientificRegistry();
    expect(reg.blocks).toHaveLength(5);

    const [b1, b2, b3, b4, b5] = reg.blocks;
    expect(b1.id).toBe('BLOCO-I');
    expect(b1.formulations).toHaveLength(10); // 1 a 10

    expect(b2.id).toBe('BLOCO-II');
    expect(b2.formulations).toHaveLength(12); // 11 a 22

    expect(b3.id).toBe('BLOCO-III');
    expect(b3.formulations).toHaveLength(18); // 23 a 40

    expect(b4.id).toBe('BLOCO-IV');
    expect(b4.formulations).toHaveLength(17); // 41 a 57

    expect(b5.id).toBe('BLOCO-V');
    expect(b5.formulations).toHaveLength(7); // 58 a 64

    const total = b1.formulations.length + b2.formulations.length + b3.formulations.length + b4.formulations.length + b5.formulations.length;
    expect(total).toBe(64);
  });

  it('Recupera formulações fundacionais específicas por ID com suas fórmulas exatas', () => {
    // 1. FORM-GRAPH-001 (Bloco I)
    const formGraph = getFormulationById('FORM-GRAPH-001');
    expect(formGraph).not.toBeNull();
    expect(formGraph?.name).toBe('Cognitive Context Graph');
    expect(formGraph?.formula).toBe('G = (V, E, T, C, P, R)');

    // 3. FORM-HCT-001 (Bloco I - Hash-Chain Trace)
    const formHct = getFormulationById('FORM-HCT-001');
    expect(formHct?.formula).toContain('SHA256');

    // 23. FORM-AEGIS-INT (Bloco III - Integridade Sistêmica)
    const formAegisInt = getFormulationById('FORM-AEGIS-INT');
    expect(formAegisInt?.formula).toContain('I_system != I_application');

    // 32. FORM-AEGIS-RTC (Bloco III - Invariante de Contrato em Runtime)
    const formRtc = getFormulationById('FORM-AEGIS-RTC');
    expect(formRtc?.formula).toContain('TypeSystem ⊆ RuntimeCapabilities');

    // 33. FORM-AEGIS-ART (Bloco III - Invariante de Integridade de Build)
    const formArt = getFormulationById('FORM-AEGIS-ART');
    expect(formArt?.formula).toBe('Artifact_tested = Artifact_deployed');

    // 56. FORM-CYB-HYST (Bloco IV - Histerese Anti-Oscilação)
    const formHyst = getFormulationById('FORM-CYB-HYST');
    expect(formHyst?.formula).toBe('Threshold_activate > Threshold_deactivate');

    // 64. FORM-CVL-001 (Bloco V - Conservação de Evidência Visual)
    const formCvl = getFormulationById('FORM-CVL-001');
    expect(formCvl?.formula).toBe('VisualWeight <= EvidenceStrength');
  });

  it('Verifica o catálogo das 10 formulações de Processamento Digital de Sinais (DSP) do OnTabs', () => {
    const reg = loadScientificRegistry();
    const dspIds = reg.musicDSPFormulations.map((f) => f.id);

    expect(dspIds).toContain('FORM-DSP-F0-001');
    expect(dspIds).toContain('FORM-MUS-MIDI-001');
    expect(dspIds).toContain('FORM-MUS-CENTS-001');
    expect(dspIds).toContain('FORM-OPT-DIJKSTRA-001');
    expect(dspIds).toContain('FORM-DSP-RMS-001');
    expect(dspIds).toContain('FORM-DSP-FLUX-001');
    expect(dspIds).toContain('FORM-DSP-SCHMITT-001');
    expect(dspIds).toContain('FORM-HAR-KRUMHANSL-001');
    expect(dspIds).toContain('FORM-DSP-BIQUAD-001');
    expect(dspIds).toContain('FORM-GOV-ADMISSION-001');
  });

  it('Comprova correspondência matemática entre a formulação canônica de Ellis cents e a implementação real', () => {
    // FORM-MUS-CENTS-001: c = 1200 * log2(f / f_ref)
    const fAbove = 442.5; // ~+10 cents
    const fBelow = 437.5; // ~-10 cents

    const sharpRes = frequencyToMidi(fAbove);
    const flatRes = frequencyToMidi(fBelow);

    expect(sharpRes.cents).toBe(10);
    expect(flatRes.cents).toBe(-10);
  });

  it('Comprova estimativa determinística de F0 (FORM-DSP-F0-001) em sinal senoidal puro sem ML', () => {
    const sampleRate = 44100;
    const targetFreq = 440.0; // A4
    const numSamples = 4096;
    const signal = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      signal[i] = Math.sin((2 * Math.PI * targetFreq * i) / sampleRate);
    }

    const estimated = estimatePitchAutocorrelation(signal, sampleRate, 0, 2048);
    expect(estimated).not.toBeNull();
    if (estimated) {
      expect(estimated.midi).toBe(69);
      expect(Math.abs(estimated.frequency - targetFreq)).toBeLessThan(1.0); // Erro < 1 Hz
      expect(Math.abs(estimated.cents)).toBeLessThan(5); // Erro < 5 cents
      expect(estimated.clarity).toBeGreaterThan(0.85); // Alta pureza harmônica
    }
  });

  it('Verifica o registro das 3 novas formulações científicas propostas para resolver lacunas', () => {
    const reg = loadScientificRegistry();
    const proposedIds = reg.proposedFormulations.map((f) => f.id);

    expect(proposedIds).toContain('FORM-DSP-HARM-SIEVE-001');
    expect(proposedIds).toContain('FORM-BASS-COMPLEX-001');
    expect(proposedIds).toContain('FORM-POLY-SEPARATION-001');
    expect(reg.proposedFormulations.every((f) => f.status === 'HYPOTHESIS_FORMALIZED')).toBe(true);
  });
});
