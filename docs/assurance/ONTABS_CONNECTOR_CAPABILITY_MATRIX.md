# OnTabs — Matriz de Capacidade dos Conectores Externos (Phase A/B)

**Data**: 2026-10-19  
**Responsável**: Antigravity — Hardening & Technical Assurance  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Princípios de Integração de Mídia Externa

1. **Respeito aos Termos de Serviço (TOS)**: O OnTabs não implementa, em hipótese alguma, rotinas de download de fluxos de áudio protegidos por DRM, quebra de cifras (cipher decryptors) ou evasão de autenticação de provedores como YouTube e Spotify.
2. **Diferenciação Estrita de Metadados vs. Análise de Áudio**: Um link do YouTube ou Spotify fornece metadados catalográficos (título, artista, capa, duração, ID de obra). A análise harmônica e transcrição para tablatura exige que o usuário associe um arquivo de áudio autorizado para processamento no navegador.
3. **Proteção Contra SSRF**: Nenhum link externo recebido pelo servidor é seguido de forma cega sem validação estrita de esquema (`https:`) e domínio permitido.

---

## 2. Matriz de Conectores

| Provedor | URLs Suportadas | Capacidade Real | Requisitos de Acesso | O que NÃO é Suportado | Mensagem ao Usuário |
|---|---|---|---|---|---|
| **YouTube** | `https://www.youtube.com/watch?v={id}`<br>`https://youtu.be/{id}` | Extração de ID de vídeo, validação de formato e registro de intenção de análise | Nenhuma chave para extração de ID; YouTube Data API v3 para metadados | Download de stream de áudio; extração de vídeos privados ou com restrição de idade | *"O link registra os metadados do vídeo. Para transcrever a tablatura, envie um arquivo de áudio que você tenha autorização de uso."* |
| **Spotify** | `https://open.spotify.com/track/{id}` | Extração de ID de faixa, metadados (Título, Artista, Álbum) via Web API oficial | Credenciais OAuth de Desenvolvedor (Client ID e Secret) | Download do arquivo de áudio master (Spotify provê apenas áudio protegido por DRM) | *"O link do Spotify vincula os metadados oficiais da faixa. Para gerar a tablatura, associe um arquivo de áudio local."* |
| **Arquivo Local** | Arquivos `.mp3`, `.wav`, `.ogg`, `.mp4` (com áudio) | Decodificação direta no navegador via Web Audio API, cálculo de BPM e pitch tracking | Permissão de leitura de arquivo local pelo usuário | Arquivos sem faixa de áudio ou formatos proprietários não suportados pelo browser (ex: WMA, RealAudio) | *"Processamento executado 100% no seu navegador sem envio desnecessário de dados para a nuvem."* |

---

## 3. Especificação Técnica dos Conectores

### Conector YouTube (`YouTubeConnector`)
- **Regex de Validação**:
  `^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})`
- **Validação de Host**: Rejeita qualquer requisição onde o hostname não seja estritamente `youtube.com`, `www.youtube.com` ou `youtu.be`.
- **Comportamento em Falha**: Se a URL for inválida, retorna erro 400 imediato: `"Formato de link do YouTube inválido. Use https://youtube.com/watch?v=... ou https://youtu.be/..."`.

### Conector Spotify (`SpotifyConnector`)
- **Regex de Validação**:
  `^(https?:\/\/)?(open\.)?spotify\.com\/track\/([a-zA-Z0-9]{22})`
- **Validação de Host**: Rejeita qualquer hostname diferente de `open.spotify.com`.
- **Comportamento de Autenticação**: Requer token de aplicação Spotify (`client_credentials`) para consulta de metadados. Quando as credenciais não estiverem configuradas, o conector extrai o ID estrutural da URL e orienta o usuário com transparência.

---

## 4. Testes de Conformidade do Conector

| Teste | Entrada | Resultado Esperado |
|---|---|---|
| `VALID_YT_01` | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` | Aceito; ID `dQw4w9WgXcQ` extraído; solicita áudio local |
| `VALID_YT_02` | `https://youtu.be/dQw4w9WgXcQ` | Aceito; ID `dQw4w9WgXcQ` extraído; solicita áudio local |
| `INVALID_YT_01` | `https://youtube.com/invalid_path` | Rejeitado com erro 400 |
| `SSRF_ATTEMPT_01` | `http://169.254.169.254/youtube` | Rejeitado imediatamente (Host proibido) |
| `VALID_SPOT_01` | `https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT` | Aceito; ID de faixa `4cOdK2wGLETKBW3PvgPWqT` extraído |
