// src/engine/__tests__/connectors.test.ts
import { describe, it, expect } from 'vitest';
import { resolveExternalConnectorUrl } from '../connectors';

describe('External Media Connectors - Validation, SSRF Protection & Capabilities', () => {
  it('Aceita e extrai metadados de URL padrão do YouTube (watch?v=)', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = resolveExternalConnectorUrl(url);

    expect(result.provider).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
    expect(result.canonicalUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.requiresLocalAudio).toBe(true);
    expect(result.message).toContain('arquivo de áudio');
  });

  it('Aceita e extrai metadados de URL encurtada do YouTube (youtu.be/)', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    const result = resolveExternalConnectorUrl(url);

    expect(result.provider).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
    expect(result.canonicalUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('Aceita e extrai metadados de faixa oficial do Spotify (open.spotify.com/track/)', () => {
    const url = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT';
    const result = resolveExternalConnectorUrl(url);

    expect(result.provider).toBe('spotify');
    expect(result.id).toBe('4cOdK2wGLETKBW3PvgPWqT');
    expect(result.canonicalUrl).toBe('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
    expect(result.requiresLocalAudio).toBe(true);
    expect(result.message).toContain('DRM');
  });

  it('Bloqueia tentativa de SSRF contra metadados de cloud (169.254.169.254)', () => {
    expect(() => {
      resolveExternalConnectorUrl('http://169.254.169.254/latest/meta-data');
    }).toThrow(/endereços locais ou de rede privada/i);
  });

  it('Bloqueia tentativa de SSRF contra localhost / 127.0.0.1', () => {
    expect(() => {
      resolveExternalConnectorUrl('http://localhost:3000/api/admin');
    }).toThrow(/endereços locais ou de rede privada/i);

    expect(() => {
      resolveExternalConnectorUrl('http://127.0.0.1:8080/internal');
    }).toThrow(/endereços locais ou de rede privada/i);
  });

  it('Rejeita domínios não suportados', () => {
    expect(() => {
      resolveExternalConnectorUrl('https://soundcloud.com/artist/track');
    }).toThrow(/não suportado/i);
  });

  it('Rejeita IDs de YouTube com formato inválido', () => {
    expect(() => {
      resolveExternalConnectorUrl('https://www.youtube.com/watch?v=short');
    }).toThrow(/deve conter 11 caracteres/i);
  });
});
