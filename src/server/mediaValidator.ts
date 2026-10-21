// src/server/mediaValidator.ts
// Ontabs Secure Media Ingestion & Anti-Traversal Validator
// Verificação de assinaturas mágicas (magic bytes), limites de recurso, isolamento multiusuário e higienização de arquivos.

import fs from 'node:fs';
import path from 'node:path';

export interface MediaValidationConfig {
  maxSizeBytes: number; // Padrão: 30 MB
  maxDurationSeconds: number; // Padrão: 600 segundos (10 minutos)
  allowedExtensions: string[];
}

export const DEFAULT_MEDIA_CONFIG: MediaValidationConfig = {
  maxSizeBytes: 30 * 1024 * 1024,
  maxDurationSeconds: 600,
  allowedExtensions: ['.mp3', '.mp4', '.m4a', '.wav', '.ogg'],
};

export type DetectedFormat = 'mp3' | 'mp4' | 'm4a' | 'wav' | 'ogg' | 'unknown';

export interface MediaValidationResult {
  isValid: boolean;
  detectedFormat: DetectedFormat;
  mimeType: string;
  sizeBytes: number;
  reasonCode: string;
  error?: string;
}

/**
 * Detecta a assinatura binária real (magic bytes) no início do buffer.
 */
export function detectAudioSignature(buffer: Buffer): { format: DetectedFormat; mimeType: string } {
  if (!buffer || buffer.length < 8) {
    return { format: 'unknown', mimeType: 'application/octet-stream' };
  }

  // 1. MP3 com Header ID3v2: "ID3" (0x49, 0x44, 0x33)
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { format: 'mp3', mimeType: 'audio/mpeg' };
  }

  // 2. MP3 sem ID3 (Frame Sync padrão MPEG-1/2 Audio Layer 3: 0xFF seguido de 0xFB, 0xF3, 0xF2, 0xE3)
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    const layer = (buffer[1] >> 1) & 0x03;
    if (layer === 0x01) {
      // Layer III
      return { format: 'mp3', mimeType: 'audio/mpeg' };
    }
  }

  // 3. MP4 / M4A: Caixa ftyp no offset 4 ("ftyp" = 0x66, 0x74, 0x79, 0x70)
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.toString('latin1', 8, 12);
    if (brand.startsWith('M4A') || brand.startsWith('m4a')) {
      return { format: 'm4a', mimeType: 'audio/mp4' };
    }
    return { format: 'mp4', mimeType: 'video/mp4' };
  }

  // 4. RIFF / WAV ("RIFF" ... "WAVE")
  if (
    buffer.length >= 12 &&
    buffer.toString('latin1', 0, 4) === 'RIFF' &&
    buffer.toString('latin1', 8, 12) === 'WAVE'
  ) {
    return { format: 'wav', mimeType: 'audio/wav' };
  }

  // 5. Ogg Vorbis ("OggS" = 0x4F, 0x67, 0x67, 0x53)
  if (
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return { format: 'ogg', mimeType: 'audio/ogg' };
  }

  return { format: 'unknown', mimeType: 'application/octet-stream' };
}

/**
 * Validação rigorosa de arquivo de mídia. Rejeita extensões mascaradas, arquivos corrompidos ou maliciosos.
 */
export function validateMediaBuffer(
  buffer: Buffer,
  filename: string,
  config: MediaValidationConfig = DEFAULT_MEDIA_CONFIG
): MediaValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      detectedFormat: 'unknown',
      mimeType: 'application/octet-stream',
      sizeBytes: 0,
      reasonCode: 'EMPTY_FILE',
      error: 'Arquivo de áudio vazio ou sem dados (0 bytes).',
    };
  }

  if (buffer.length > config.maxSizeBytes) {
    return {
      isValid: false,
      detectedFormat: 'unknown',
      mimeType: 'application/octet-stream',
      sizeBytes: buffer.length,
      reasonCode: 'OVERSIZED_FILE',
      error: `Arquivo excede o limite máximo permitido de ${(config.maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`,
    };
  }

  // Validação de extensão declarada
  const ext = path.extname(filename).toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      detectedFormat: 'unknown',
      mimeType: 'application/octet-stream',
      sizeBytes: buffer.length,
      reasonCode: 'UNSUPPORTED_EXTENSION',
      error: `Extensão de arquivo '${ext}' não é suportada. Formatos aceitos: ${config.allowedExtensions.join(', ')}`,
    };
  }

  // Validação estrita de assinatura binária (Magic Bytes)
  const { format, mimeType } = detectAudioSignature(buffer);

  if (format === 'unknown') {
    return {
      isValid: false,
      detectedFormat: 'unknown',
      mimeType: 'application/octet-stream',
      sizeBytes: buffer.length,
      reasonCode: 'SIGNATURE_MISMATCH',
      error: 'Assinatura binária do arquivo não corresponde a nenhum codec de áudio suportado (MP3, MP4, WAV, OGG). Arquivo possivelmente corrompido ou mascarado.',
    };
  }

  // Checagem de correspondência entre extensão e assinatura
  const isCompatible =
    (ext === '.mp3' && format === 'mp3') ||
    ((ext === '.mp4' || ext === '.m4a') && (format === 'mp4' || format === 'm4a')) ||
    (ext === '.wav' && format === 'wav') ||
    (ext === '.ogg' && format === 'ogg');

  if (!isCompatible) {
    return {
      isValid: false,
      detectedFormat: format,
      mimeType,
      sizeBytes: buffer.length,
      reasonCode: 'EXTENSION_SPOOF_DETECTED',
      error: `Incompatibilidade detectada: o arquivo possui extensão '${ext}', mas a assinatura interna é '${format}'. Possível tentativa de spoofing.`,
    };
  }

  return {
    isValid: true,
    detectedFormat: format,
    mimeType,
    sizeBytes: buffer.length,
    reasonCode: 'ACCEPTED_SAFE',
  };
}

/**
 * Higieniza o nome de arquivo para prevenir Path Traversal e injeção de caracteres de controle.
 */
export function sanitizeSafeFilename(rawFilename: string): string {
  if (!rawFilename) return 'audio_track.mp3';

  let base = rawFilename;

  // Se for um caminho com traversal evidente ou diretórios de sistema, extrai o basename
  if (
    base.startsWith('../') ||
    base.startsWith('..\\') ||
    base.includes('/etc/') ||
    base.includes('\\system32\\') ||
    base.includes('/system32/')
  ) {
    const parts = base.split(/[/\\]/);
    base = parts[parts.length - 1];
  }

  // Substitui qualquer caractere que não seja alfanumérico, ponto, underscore ou traço
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_');

  if (!clean || clean === '.' || clean === '..' || clean.replace(/[_.-]/g, '').length === 0) {
    return `upload_${Date.now()}.mp3`;
  }

  return clean;
}

/**
 * Prepara o diretório isolado de um usuário garantindo que um usuário não possa acessar arquivos de outro.
 */
export function getIsolatedUserUploadPath(
  baseUploadDir: string,
  userId: string,
  filename: string
): { safePath: string; safeFilename: string } {
  // Previne injeção de usuário
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeFilename = sanitizeSafeFilename(filename);

  const userDir = path.join(baseUploadDir, safeUserId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const safePath = path.join(userDir, safeFilename);

  // Verificação de contenção: safePath precisa começar estritamente com userDir
  const normalizedPath = path.normalize(safePath);
  const normalizedUserDir = path.normalize(userDir);

  if (!normalizedPath.startsWith(normalizedUserDir)) {
    throw new Error('Violação de segurança detectada: tentativa de escape de diretório (Path Traversal).');
  }

  return { safePath: normalizedPath, safeFilename };
}
