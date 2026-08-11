// src/services/integrationService.ts
//
// NÃO IMPLEMENTADO. Contratos de integração externa preparados para o futuro.
// Propositalmente este serviço NÃO baixa áudio de YouTube/Spotify — isso
// violaria termos de serviço e, no caso de conteúdo protegido, direitos
// autorais. Qualquer implementação real futura deve usar APIs oficiais e
// exigir que o usuário tenha autorização de uso do conteúdo.

export interface YoutubeMetadata {
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number;
}

export interface SpotifyTrackMetadata {
  trackId: string;
  title: string;
  artist: string;
  durationSeconds: number;
}

export interface IntegrationService {
  resolveYoutubeMetadata(url: string): Promise<YoutubeMetadata>;
  resolveSpotifyTrack(url: string): Promise<SpotifyTrackMetadata>;
}

class NotImplementedIntegrationService implements IntegrationService {
  async resolveYoutubeMetadata(): Promise<YoutubeMetadata> {
    throw new Error('Integração com YouTube ainda não implementada. Use a API oficial do YouTube quando disponível.');
  }

  async resolveSpotifyTrack(): Promise<SpotifyTrackMetadata> {
    throw new Error('Integração com Spotify ainda não implementada. Use a Spotify Web API (OAuth) quando disponível.');
  }
}

export const integrationService: IntegrationService = new NotImplementedIntegrationService();
