// src/server/__tests__/mediaValidator.test.ts
// Testes unitários para Validação Segura de Ingestão de Áudio (MP3/MP4), Assinaturas Mágicas e Isolamento Multiusuário.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  detectAudioSignature,
  validateMediaBuffer,
  sanitizeSafeFilename,
  getIsolatedUserUploadPath,
  DEFAULT_MEDIA_CONFIG,
} from '../mediaValidator';

describe('Media Ingestion Validator - Magic Bytes, Limits & Security', () => {
  let tempBaseDir: string;

  beforeEach(() => {
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ontabs-upload-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempBaseDir)) {
      fs.rmSync(tempBaseDir, { recursive: true, force: true });
    }
  });

  it('Reconhece e valida arquivo MP3 legítimo com cabeçalho ID3v2', () => {
    // 0x49, 0x44, 0x33 ("ID3") + versão + flags + tamanho
    const mp3Buffer = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0xff, 0xfb, 0x90, 0x64]);
    const sig = detectAudioSignature(mp3Buffer);
    expect(sig.format).toBe('mp3');
    expect(sig.mimeType).toBe('audio/mpeg');

    const validation = validateMediaBuffer(mp3Buffer, 'audio_ensaio.mp3');
    expect(validation.isValid).toBe(true);
    expect(validation.reasonCode).toBe('ACCEPTED_SAFE');
    expect(validation.detectedFormat).toBe('mp3');
  });

  it('Reconhece e valida arquivo MP3 com Frame Sync puro (MPEG-1 Layer III)', () => {
    const rawMp3Buffer = Buffer.from([0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04]);
    const sig = detectAudioSignature(rawMp3Buffer);
    expect(sig.format).toBe('mp3');

    const validation = validateMediaBuffer(rawMp3Buffer, 'gravacao_direta.mp3');
    expect(validation.isValid).toBe(true);
    expect(validation.reasonCode).toBe('ACCEPTED_SAFE');
  });

  it('Reconhece e valida arquivo MP4/M4A legítimo com caixa ftyp', () => {
    // 4 bytes de tamanho + "ftyp" + "isom"
    const mp4Buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x20]),
      Buffer.from('ftyp', 'latin1'),
      Buffer.from('isom', 'latin1'),
      Buffer.from([0x00, 0x00, 0x02, 0x00]),
    ]);

    const sig = detectAudioSignature(mp4Buffer);
    expect(sig.format).toBe('mp4');
    expect(sig.mimeType).toBe('video/mp4');

    const validation = validateMediaBuffer(mp4Buffer, 'aula_guitarra.mp4');
    expect(validation.isValid).toBe(true);
    expect(validation.reasonCode).toBe('ACCEPTED_SAFE');
  });

  it('Rejeita tentativa de spoofing (arquivo de texto renomeado para .mp3)', () => {
    const fakeMp3Buffer = Buffer.from('<html><script>alert("malicioso")</script></html>', 'utf-8');
    const validation = validateMediaBuffer(fakeMp3Buffer, 'malware.mp3');

    expect(validation.isValid).toBe(false);
    expect(validation.reasonCode).toBe('SIGNATURE_MISMATCH');
    expect(validation.error).toContain('Assinatura binária do arquivo não corresponde');
  });

  it('Rejeita tentativa de extensão falsificada (.mp4 contendo assinatura .wav)', () => {
    const fakeWavAsMp4 = Buffer.concat([
      Buffer.from('RIFF', 'latin1'),
      Buffer.from([0x24, 0x00, 0x00, 0x00]),
      Buffer.from('WAVE', 'latin1'),
      Buffer.from('fmt ', 'latin1'),
    ]);

    const validation = validateMediaBuffer(fakeWavAsMp4, 'musica_disfarcada.mp4');
    expect(validation.isValid).toBe(false);
    expect(validation.reasonCode).toBe('EXTENSION_SPOOF_DETECTED');
    expect(validation.error).toContain('Incompatibilidade detectada');
  });

  it('Rejeita arquivo vazio (0 bytes)', () => {
    const empty = Buffer.alloc(0);
    const validation = validateMediaBuffer(empty, 'vazio.mp3');

    expect(validation.isValid).toBe(false);
    expect(validation.reasonCode).toBe('EMPTY_FILE');
    expect(validation.error).toContain('vazio');
  });

  it('Rejeita arquivo acima do limite máximo de tamanho', () => {
    const oversizedConfig = { ...DEFAULT_MEDIA_CONFIG, maxSizeBytes: 1024 }; // limite de 1KB para teste
    const bigBuffer = Buffer.alloc(2048, 0x49); // 2KB

    const validation = validateMediaBuffer(bigBuffer, 'pesado.mp3', oversizedConfig);
    expect(validation.isValid).toBe(false);
    expect(validation.reasonCode).toBe('OVERSIZED_FILE');
    expect(validation.error).toContain('limite máximo permitido');
  });

  it('Higieniza nomes de arquivo maliciosos prevenindo Path Traversal', () => {
    expect(sanitizeSafeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeSafeFilename('..\\windows\\system32\\calc.exe')).toBe('calc.exe');
    expect(sanitizeSafeFilename('musica; rm -rf /; .mp3')).toBe('musica__rm_-rf____.mp3');
    expect(sanitizeSafeFilename('')).toBe('audio_track.mp3');
  });

  it('Garante isolamento de armazenamento entre usuários e bloqueia escape de diretório', () => {
    const userA = 'usr_alice_123';
    const userB = 'usr_bob_456';

    const pathA = getIsolatedUserUploadPath(tempBaseDir, userA, 'faixa1.mp3');
    const pathB = getIsolatedUserUploadPath(tempBaseDir, userB, 'faixa1.mp3');

    // Diretórios distintos
    expect(pathA.safePath).not.toBe(pathB.safePath);
    expect(pathA.safePath).toContain(userA);
    expect(pathB.safePath).toContain(userB);

    // Tentativa de Path Traversal no userId
    const malUser = '../../root_escape';
    const escaped = getIsolatedUserUploadPath(tempBaseDir, malUser, 'teste.mp3');
    expect(escaped.safePath).not.toContain('../');
    expect(escaped.safePath.startsWith(tempBaseDir)).toBe(true);
  });
});
