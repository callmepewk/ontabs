// src/engine/connectors.ts
// Validação, Segurança e Resolução de Conectores de Mídia Externa (YouTube e Spotify)
// Conformidade estrita com termos de serviço, mitigação de SSRF e transparência técnica.

export type SupportedProvider = 'youtube' | 'spotify';

export interface ExternalMediaMetadata {
  provider: SupportedProvider;
  id: string;
  canonicalUrl: string;
  title: string;
  artist?: string;
  requiresLocalAudio: boolean;
  message: string;
}

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local / Cloud Metadata (AWS, Azure, GCP)
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

/**
 * Valida a URL e extrai metadados sem efetuar download de streams protegidos por DRM.
 */
export function resolveExternalConnectorUrl(rawUrl: string): ExternalMediaMetadata {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL fornecida é vazia ou inválida.');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Formato de URL inválido. Insira um link completo com https://');
  }

  // 1. Validação de Protocolo
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Protocolo '${parsed.protocol}' não permitido. Use HTTPS.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Proteção Estrita contra SSRF e Acesso Interno
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error('Acesso a endereços locais ou de rede privada é estritamente proibido.');
    }
  }

  // 3. Conector YouTube
  if (
    hostname === 'youtube.com' ||
    hostname === 'www.youtube.com' ||
    hostname === 'm.youtube.com' ||
    hostname === 'youtu.be'
  ) {
    let videoId: string | null = null;

    if (hostname === 'youtu.be') {
      const match = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{11})/);
      if (match) videoId = match[1];
    } else {
      videoId = parsed.searchParams.get('v');
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      throw new Error('Link do YouTube inválido. O ID do vídeo deve conter 11 caracteres alfanuméricos.');
    }

    return {
      provider: 'youtube',
      id: videoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title: `Vídeo YouTube [${videoId}]`,
      requiresLocalAudio: true,
      message:
        'O link registra os metadados do vídeo. Para transcrever a tablatura com precisão técnica e respeitar os termos de serviço da plataforma, forneça o arquivo de áudio autorizado correspondente.',
    };
  }

  // 4. Conector Spotify
  if (hostname === 'open.spotify.com') {
    const match = parsed.pathname.match(/^\/track\/([a-zA-Z0-9]{22})/);
    if (!match) {
      throw new Error('Link do Spotify inválido. O link deve apontar para uma faixa: open.spotify.com/track/{id}.');
    }

    const trackId = match[1];
    return {
      provider: 'spotify',
      id: trackId,
      canonicalUrl: `https://open.spotify.com/track/${trackId}`,
      title: `Faixa Spotify [${trackId}]`,
      requiresLocalAudio: true,
      message:
        'O link do Spotify vincula os metadados oficiais da faixa. O áudio do Spotify é protegido por DRM da plataforma e não pode ser baixado. Forneça o arquivo de áudio autorizado para gerar a tablatura.',
    };
  }

  throw new Error(
    `Domínio '${hostname}' não suportado para importação externa. Use links públicos do YouTube ou Spotify.`
  );
}
