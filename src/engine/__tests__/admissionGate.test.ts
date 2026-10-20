// src/engine/__tests__/admissionGate.test.ts
// Testes unitários do Portão de Admissão de Direitos e Biblioteca OnTabs (Positivos, Negativos e Ciclo de Vida).

import { describe, it, expect } from 'vitest';
import { evaluateAssetOperation, validateCollectionAdmission } from '../admissionGate';
import { VerifiedCatalogAsset } from '@/types/rights';
import fs from 'node:fs';
import path from 'node:path';

const catalogPath = path.resolve(process.cwd(), 'data', 'music-library', 'catalog.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const assets: VerifiedCatalogAsset[] = catalogData.assets;

describe('Ontabs Admission Gate - Positive Verification Cases', () => {
  it('Admite gravação clássica de domínio público (Beethoven Musopen CC0) para reprodução pública', () => {
    const beethoven = assets.find((a) => a.id === 'asset_musopen_beethoven_sym5')!;
    expect(beethoven).toBeDefined();

    const evalResult = evaluateAssetOperation(beethoven, 'PUBLIC_PLAYBACK');
    expect(evalResult.allowed).toBe(true);
    expect(evalResult.decision).toBe('ALLOWED');
    expect(evalResult.reasonCode).toBe('ADMITTED_OPERATION_PERMITTED');

    const admission = validateCollectionAdmission(beethoven, 'public_demo');
    expect(admission.admitted).toBe(true);
    expect(admission.issues.length).toBe(0);
  });

  it('Admite clássico de domínio público brasileiro (Ernesto Nazareth 1912) com condição de atribuição', () => {
    const nazareth = assets.find((a) => a.id === 'asset_br_ernesto_nazareth_odeon_1912')!;
    expect(nazareth).toBeDefined();

    const evalResult = evaluateAssetOperation(nazareth, 'PUBLIC_PLAYBACK');
    expect(evalResult.allowed).toBe(true);
    expect(evalResult.decision).toBe('ALLOWED_WITH_CONDITIONS');
    expect(evalResult.reasonCode).toBe('ADMITTED_WITH_ATTRIBUTION_CONDITION');
    expect(evalResult.applicableRestrictions[0]).toContain('Crédito obrigatório');
  });

  it('Admite dataset GuitarSet com captação hexafônica para testes internos e ground-truth', () => {
    const guitarset = assets.find((a) => a.id === 'asset_guitarset_solo_excerpt_01')!;
    expect(guitarset).toBeDefined();

    const testEval = evaluateAssetOperation(guitarset, 'INTERNAL_TEST');
    expect(testEval.allowed).toBe(true);

    const admission = validateCollectionAdmission(guitarset, 'transcription_ground_truth');
    expect(admission.admitted).toBe(true);
  });
});

describe('Ontabs Admission Gate - Negative Security & Policy Cases', () => {
  it('Bloqueia estritamente licença Não-Comercial (MUSDB18 CC BY-NC-SA) no portão comercial', () => {
    const musdb = assets.find((a) => a.id === 'asset_musdb18_benchmark_track')!;
    expect(musdb).toBeDefined();

    const commEval = evaluateAssetOperation(musdb, 'COMMERCIAL_PROCESSING');
    expect(commEval.allowed).toBe(false);
    expect(commEval.decision).toBe('BLOCKED');
    expect(commEval.reasonCode).toBe('BLOCKED_NON_COMMERCIAL_RESTRICTION');
    expect(commEval.explanation).toContain('Não-Comercial (NC)');

    // Rejeita admissão no catálogo comercial de jogadores
    const admission = validateCollectionAdmission(musdb, 'user_playable_catalog');
    expect(admission.admitted).toBe(false);
    expect(admission.issues.some((i) => i.includes('desautorizado'))).toBe(true);
  });

  it('Bloqueia uso comercial e treinamento de IA em biblioteca Cambridge MT Mixing Secrets', () => {
    const cambridge = assets.find((a) => a.id === 'asset_cambridge_mt_metal_arise')!;
    expect(cambridge).toBeDefined();

    const aiEval = evaluateAssetOperation(cambridge, 'MODEL_TRAINING');
    expect(aiEval.allowed).toBe(false);
    expect(aiEval.decision).toBe('BLOCKED');

    const commEval = evaluateAssetOperation(cambridge, 'COMMERCIAL_PROCESSING');
    expect(commEval.allowed).toBe(false);
  });

  it('Bloqueia extração de áudio e reprodução direta de stream protegido do Spotify', () => {
    const stones = assets.find((a) => a.id === 'asset_spotify_stones_knockin')!;
    expect(stones).toBeDefined();

    const playbackEval = evaluateAssetOperation(stones, 'PUBLIC_PLAYBACK');
    expect(playbackEval.allowed).toBe(false);
    expect(playbackEval.reasonCode).toBe('BLOCKED_STREAMING_DRM_PROTECTED');

    // Aceita com segurança na coleção de quarentena/metadados restritos
    const admission = validateCollectionAdmission(stones, 'restricted_or_pending');
    expect(admission.admitted).toBe(true);
    expect(admission.reasonCode).toBe('ADMITTED_TO_QUARANTINE');
  });

  it('Não infere reprodução pública a partir de autorização exclusiva de processamento privado', () => {
    const privateAsset: VerifiedCatalogAsset = {
      ...assets[0],
      id: 'mock_private_upload',
      permissions: {
        ...assets[0].permissions,
        privateProcessing: 'ALLOWED',
        publicPlayback: 'BLOCKED',
      },
    };

    const evalResult = evaluateAssetOperation(privateAsset, 'PUBLIC_PLAYBACK');
    expect(evalResult.allowed).toBe(false);
    expect(evalResult.reasonCode).toBe('BLOCKED_MISSING_PUBLIC_PLAYBACK_RIGHT');
    expect(evalResult.explanation).toContain('não confere direitos de reprodução');
  });

  it('Bloqueia ativo quando a atribuição é mandatória mas o crédito está incompleto', () => {
    const missingCreditAsset: VerifiedCatalogAsset = {
      ...assets[1],
      id: 'mock_no_attribution',
      attribution: {
        required: true,
        creditText: '', // vazio
        licenseName: 'CC BY 4.0',
        licenseUrl: '', // vazio
      },
      artist: '',
    };

    const evalResult = evaluateAssetOperation(missingCreditAsset, 'PUBLIC_PLAYBACK');
    expect(evalResult.allowed).toBe(false);
    expect(evalResult.reasonCode).toBe('BLOCKED_MISSING_REQUIRED_ATTRIBUTION');
  });

  it('Bloqueia imediatamente ativo com notificação de revogação ou takedown ativo', () => {
    const revokedAsset: VerifiedCatalogAsset = {
      ...assets[0],
      id: 'mock_revoked_asset',
      isRevoked: true,
      takedownReason: 'Solicitação extrajudicial de cessação de uso pelo produtor fonográfico.',
    };

    const evalResult = evaluateAssetOperation(revokedAsset, 'INTERNAL_TEST');
    expect(evalResult.allowed).toBe(false);
    expect(evalResult.decision).toBe('REVOKED');
    expect(evalResult.reasonCode).toBe('BLOCKED_LICENSE_REVOKED');
  });
});
