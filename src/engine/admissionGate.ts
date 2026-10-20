// src/engine/admissionGate.ts
// Ontabs Deterministic Admission Gate & Rights-Aware Policy Engine
// Avalia a elegibilidade de ativos para coleções da biblioteca e operações de produto.

import {
  AdmissionEvaluationResult,
  LibraryCollectionId,
  OperationScope,
  VerifiedCatalogAsset,
} from '@/types/rights';

/**
 * Avalia se um ativo musical tem evidências suficientes para executar uma operação específica.
 * Falha de forma fechada (fail-closed) para qualquer operação pública ou comercial sem comprovação.
 */
export function evaluateAssetOperation(
  asset: VerifiedCatalogAsset,
  operation: OperationScope
): AdmissionEvaluationResult {
  const evaluatedAt = new Date().toISOString();
  const missingEvidence: string[] = [];
  const applicableRestrictions: string[] = [];

  // 1. Verificação de Revogação / Takedown
  if (asset.isRevoked) {
    return {
      assetId: asset.id,
      targetCollection: asset.targetCollection,
      requestedOperation: operation,
      decision: 'REVOKED',
      allowed: false,
      reasonCode: 'BLOCKED_LICENSE_REVOKED',
      explanation: `Ativo revogado ou com notificação de takedown ativa. Motivo: ${asset.takedownReason || 'Revogação registrada pelo titular.'}`,
      missingEvidence: [],
      applicableRestrictions: ['Takedown / Revogação ativa'],
      requiresLegalReview: false,
      evaluatedAt,
    };
  }

  // 2. Mapeamento de permissão específica para a operação solicitada
  let opDecision = asset.permissions.internalTest;
  switch (operation) {
    case 'INTERNAL_TEST':
      opDecision = asset.permissions.internalTest;
      break;
    case 'PRIVATE_PROCESSING':
      opDecision = asset.permissions.privateProcessing;
      break;
    case 'COMMERCIAL_PROCESSING':
      opDecision = asset.permissions.commercialProcessing;
      break;
    case 'STEM_GENERATION':
      opDecision = asset.permissions.stemGeneration;
      break;
    case 'TABLATURE_DISPLAY':
      opDecision = asset.permissions.tablatureDisplay;
      break;
    case 'PUBLIC_PLAYBACK':
      opDecision = asset.permissions.publicPlayback;
      break;
    case 'REDISTRIBUTION':
      opDecision = asset.permissions.redistribution;
      break;
    case 'MODEL_TRAINING':
      opDecision = asset.permissions.modelTraining;
      break;
  }

  // 3. Regra de Não-Inferência: Permissão privada NÃO infere permissão pública
  if (operation === 'PUBLIC_PLAYBACK' && asset.permissions.privateProcessing === 'ALLOWED' && asset.permissions.publicPlayback !== 'ALLOWED') {
    return {
      assetId: asset.id,
      targetCollection: asset.targetCollection,
      requestedOperation: operation,
      decision: 'BLOCKED',
      allowed: false,
      reasonCode: 'BLOCKED_MISSING_PUBLIC_PLAYBACK_RIGHT',
      explanation: 'A autorização para processamento privado no dispositivo do usuário não confere direitos de reprodução ou streaming público.',
      missingEvidence: ['Licença expressa de execução pública ou declaração de domínio público do fonograma'],
      applicableRestrictions: ['Restrito a uso privado individual'],
      requiresLegalReview: false,
      evaluatedAt,
    };
  }

  // 4. Bloqueio Estrito de Uso Comercial em Licenças Não-Comerciais (NC)
  const licenseNameLower = asset.attribution.licenseName?.toLowerCase() || '';
  const isNonCommercial =
    asset.licenseId.toUpperCase().includes('NC') ||
    licenseNameLower.includes('non-commercial') ||
    licenseNameLower.includes('não-comercial');

  if (isNonCommercial && (operation === 'COMMERCIAL_PROCESSING' || operation === 'REDISTRIBUTION')) {
    return {
      assetId: asset.id,
      targetCollection: asset.targetCollection,
      requestedOperation: operation,
      decision: 'BLOCKED',
      allowed: false,
      reasonCode: 'BLOCKED_NON_COMMERCIAL_RESTRICTION',
      explanation: `A licença '${asset.licenseId}' possui cláusula expressa Não-Comercial (NC). Operações comerciais ou monetizadas são estritamente vedadas.`,
      missingEvidence: ['Licença comercial direta com o titular dos direitos patrimoniais'],
      applicableRestrictions: ['Uso exclusivamente não-comercial / acadêmico'],
      requiresLegalReview: false,
      evaluatedAt,
    };
  }

  // 5. Verificação de Atribuição Obrigatória
  if (asset.attribution.required) {
    if (!asset.attribution.creditText && !asset.artist) {
      missingEvidence.push('Texto canônico de crédito e citação do autor original');
    }
    if (!asset.attribution.licenseUrl) {
      missingEvidence.push('URL canônica do texto da licença');
    }
  }

  // 6. Bloqueio de Links Externos de Streaming Protegidos por DRM (Spotify / YouTube)
  if (asset.audioAcquisitionMethod === 'EXTERNAL_METADATA_ONLY') {
    if (operation !== 'INTERNAL_TEST' && operation !== 'TABLATURE_DISPLAY') {
      return {
        assetId: asset.id,
        targetCollection: asset.targetCollection,
        requestedOperation: operation,
        decision: 'BLOCKED',
        allowed: false,
        reasonCode: 'BLOCKED_STREAMING_DRM_PROTECTED',
        explanation: 'Ativos externos identificados via streaming comercial (Spotify / YouTube) são restritos a metadados. É vedado o download, processamento ou retransmissão de fluxos de áudio.',
        missingEvidence: ['Arquivo de áudio original fornecido e autorizado pelo usuário'],
        applicableRestrictions: ['Termos de Serviço do Spotify / YouTube Developer Policy'],
        requiresLegalReview: false,
        evaluatedAt,
      };
    }
  }

  // 7. Licença Desconhecida ou Sob Revisão
  if (asset.licenseId === 'UNKNOWN' || opDecision === 'UNKNOWN') {
    return {
      assetId: asset.id,
      targetCollection: asset.targetCollection,
      requestedOperation: operation,
      decision: 'REQUIRES_REVIEW',
      allowed: false,
      reasonCode: 'REQUIRES_HUMAN_LEGAL_REVIEW',
      explanation: 'Licença ou cadeia de titularidade não determinada com evidências primárias suficientes. O ativo permanece retido na coleção restrita.',
      missingEvidence: ['Documento de cessão, termos de licenciamento ou comprovação de domínio público'],
      applicableRestrictions: ['Aguardando parecer de assessoria jurídica qualificada'],
      requiresLegalReview: true,
      evaluatedAt,
    };
  }

  // 8. Se a permissão explícita for BLOCKED
  if (opDecision === 'BLOCKED') {
    return {
      assetId: asset.id,
      targetCollection: asset.targetCollection,
      requestedOperation: operation,
      decision: 'BLOCKED',
      allowed: false,
      reasonCode: 'OPERATION_EXPLICITLY_BLOCKED',
      explanation: `A operação '${operation}' está explicitamente desautorizada para este ativo na matriz de direitos.`,
      missingEvidence,
      applicableRestrictions,
      requiresLegalReview: false,
      evaluatedAt,
    };
  }

  // 9. Se requer atribuição e os dados estão presentes: ALLOWED_WITH_CONDITIONS
  if (asset.attribution.required) {
    if (missingEvidence.length > 0) {
      return {
        assetId: asset.id,
        targetCollection: asset.targetCollection,
        requestedOperation: operation,
        decision: 'BLOCKED',
        allowed: false,
        reasonCode: 'BLOCKED_MISSING_REQUIRED_ATTRIBUTION',
        explanation: 'A licença requer atribuição pública, mas os metadados de crédito ou URL da licença estão incompletos.',
        missingEvidence,
        applicableRestrictions: ['Atribuição obrigatória pendente'],
        requiresLegalReview: false,
        evaluatedAt,
      };
    }

    return {
      assetId: asset.id,
      targetCollection: asset.targetCollection,
      requestedOperation: operation,
      decision: 'ALLOWED_WITH_CONDITIONS',
      allowed: true,
      reasonCode: 'ADMITTED_WITH_ATTRIBUTION_CONDITION',
      explanation: `Operação autorizada com a condição mandatória de exibir crédito: "${asset.attribution.creditText || asset.artist}" e link para "${asset.attribution.licenseUrl}".`,
      missingEvidence: [],
      applicableRestrictions: [`Crédito obrigatório: ${asset.attribution.licenseName}`],
      requiresLegalReview: false,
      evaluatedAt,
    };
  }

  return {
    assetId: asset.id,
    targetCollection: asset.targetCollection,
    requestedOperation: operation,
    decision: 'ALLOWED',
    allowed: true,
    reasonCode: 'ADMITTED_OPERATION_PERMITTED',
    explanation: 'Operação plenamente autorizada pelas evidências e licença registradas.',
    missingEvidence: [],
    applicableRestrictions: [],
    requiresLegalReview: false,
    evaluatedAt,
  };
}

/**
 * Validador de Admissão em Coleções da Biblioteca OnTabs.
 * Garante que nenhum ativo seja inserido em uma coleção pública sem todas as permissões necessárias.
 */
export function validateCollectionAdmission(
  asset: VerifiedCatalogAsset,
  targetCollection: LibraryCollectionId
): { admitted: boolean; reasonCode: string; issues: string[] } {
  const issues: string[] = [];

  switch (targetCollection) {
    case 'public_demo': {
      const playbackEval = evaluateAssetOperation(asset, 'PUBLIC_PLAYBACK');
      if (!playbackEval.allowed) {
        issues.push(`Reprodução pública desautorizada: ${playbackEval.explanation}`);
      }
      const displayEval = evaluateAssetOperation(asset, 'TABLATURE_DISPLAY');
      if (!displayEval.allowed) {
        issues.push(`Exibição de tablatura desautorizada: ${displayEval.explanation}`);
      }
      break;
    }

    case 'user_playable_catalog': {
      const playbackEval = evaluateAssetOperation(asset, 'PUBLIC_PLAYBACK');
      if (!playbackEval.allowed) {
        issues.push(`Reprodução pública em jogo desautorizada: ${playbackEval.explanation}`);
      }
      const commEval = evaluateAssetOperation(asset, 'COMMERCIAL_PROCESSING');
      if (!commEval.allowed) {
        issues.push(`Processamento em catálogo comercial desautorizado: ${commEval.explanation}`);
      }
      break;
    }

    case 'internal_validation': {
      const testEval = evaluateAssetOperation(asset, 'INTERNAL_TEST');
      if (!testEval.allowed) {
        issues.push(`Uso em testes internos de regressão desautorizado: ${testEval.explanation}`);
      }
      break;
    }

    case 'stem_reference_library': {
      if (!asset.hasStems) {
        issues.push('Ativo não possui faixas isoladas (multitracks) para a biblioteca de stems.');
      }
      const stemEval = evaluateAssetOperation(asset, 'STEM_GENERATION');
      if (!stemEval.allowed) {
        issues.push(`Uso de stems desautorizado: ${stemEval.explanation}`);
      }
      break;
    }

    case 'transcription_ground_truth': {
      if (!asset.hasGroundTruthTab && asset.groundTruthType === 'NONE') {
        issues.push('Ativo não possui anotações de referência verificadas para o benchmark de transcrição.');
      }
      break;
    }

    case 'restricted_or_pending': {
      // Coleção de quarentena segura sempre aceita ativos retidos
      return { admitted: true, reasonCode: 'ADMITTED_TO_QUARANTINE', issues: [] };
    }
  }

  const admitted = issues.length === 0;
  return {
    admitted,
    reasonCode: admitted ? 'ADMITTED_SUCCESS' : 'ADMISSION_CRITERIA_FAILED',
    issues,
  };
}
