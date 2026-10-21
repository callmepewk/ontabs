// src/types/rights.ts
// Ontabs Granular Music Rights & Admission Governance Model
// Modelo de conformidade de direitos de autor, fonogramas, permissões de operação e portão de admissão.

export type OperationScope =
  | 'INTERNAL_TEST'
  | 'PRIVATE_PROCESSING'
  | 'COMMERCIAL_PROCESSING'
  | 'STEM_GENERATION'
  | 'TABLATURE_DISPLAY'
  | 'PUBLIC_PLAYBACK'
  | 'REDISTRIBUTION'
  | 'MODEL_TRAINING';

export type AuthorizationDecision =
  | 'ALLOWED'
  | 'ALLOWED_WITH_CONDITIONS'
  | 'REQUIRES_REVIEW'
  | 'UNKNOWN'
  | 'BLOCKED'
  | 'EXPIRED'
  | 'REVOKED';

export type IngestionStatus =
  | 'PENDING_VALIDATION'
  | 'ACCEPTED_SAFE'
  | 'REJECTED_MALFORMED'
  | 'REJECTED_OVERSIZED'
  | 'REJECTED_SECURITY';

export type ProcessingStatus =
  | 'IDLE'
  | 'REAL_PROCESSING'
  | 'SYNTHETIC_FIXTURE'
  | 'MOCK'
  | 'UNAVAILABLE'
  | 'BLOCKED'
  | 'PARTIAL_RESULT'
  | 'COMPLETED_VERIFIED';

export type PublicationStatus =
  | 'PRIVATE_ONLY'
  | 'INTERNAL_VALIDATION_ONLY'
  | 'PUBLIC_DEMO_ALLOWED'
  | 'PUBLIC_PLAYABLE_CATALOG'
  | 'BLOCKED_PUBLICATION';

export type LibraryCollectionId =
  | 'internal_validation'
  | 'public_demo'
  | 'user_playable_catalog'
  | 'stem_reference_library'
  | 'transcription_ground_truth'
  | 'restricted_or_pending';

export interface AttributionRequirements {
  required: boolean;
  creditText?: string;
  artistUrl?: string;
  licenseName: string;
  licenseUrl: string;
}

export interface RightsHolderDetails {
  compositionAuthor: string;
  publisher?: string;
  isCompositionPublicDomain: boolean;
  recordingPerformer: string;
  phonogramProducer?: string;
  isPhonogramPublicDomain: boolean;
  isrc?: string;
  iswc?: string;
}

export interface OperationalPermissions {
  internalTest: AuthorizationDecision;
  privateProcessing: AuthorizationDecision;
  commercialProcessing: AuthorizationDecision;
  stemGeneration: AuthorizationDecision;
  tablatureDisplay: AuthorizationDecision;
  publicPlayback: AuthorizationDecision;
  redistribution: AuthorizationDecision;
  modelTraining: AuthorizationDecision;
}

export interface VerifiedCatalogAsset {
  id: string; // ID estável canônico
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  genre: string;
  subgenre?: string;
  countryOfOrigin?: string;

  // Coleção de destino
  targetCollection: LibraryCollectionId;

  // Direitos & Licença
  licenseId: string;
  licenseUrl: string;
  isPublicDomain: boolean;
  attribution: AttributionRequirements;
  rightsHolder: RightsHolderDetails;
  permissions: OperationalPermissions;

  // Evidência primária
  evidenceSource: string;
  evidenceUrl: string;
  evidenceSummary: string;
  verificationDate: string;
  verifiedBy: string;

  // Integridade técnica do arquivo
  audioAcquisitionMethod: 'DIRECT_DOWNLOAD' | 'ARCHIVE_EXTRACTION' | 'BENCHMARK_FIXTURE' | 'EXTERNAL_METADATA_ONLY';
  sourceUrl?: string;
  checksumSha256?: string;
  fileFormat: string;
  durationSeconds: number;
  sampleRate: number;
  channels: number;

  // Ground Truth & Stems
  hasStems: boolean;
  hasGroundTruthTab: boolean;
  groundTruthType?: 'MIDI_ALIGNMENT' | 'HEXAPHONIC_NOTES' | 'REFERENCE_TAB' | 'NONE';

  // Status de ciclo de vida
  ingestionStatus: IngestionStatus;
  processingStatus: ProcessingStatus;
  publicationStatus: PublicationStatus;
  isRevoked: boolean;
  takedownReason?: string;
}

export interface AdmissionEvaluationResult {
  assetId: string;
  targetCollection: LibraryCollectionId;
  requestedOperation: OperationScope;
  decision: AuthorizationDecision;
  allowed: boolean;
  reasonCode: string;
  explanation: string;
  missingEvidence: string[];
  applicableRestrictions: string[];
  requiresLegalReview: boolean;
  evaluatedAt: string;
}
