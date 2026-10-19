# OnTabs — Evidências de Testes e Linha de Base Reproduzível (Phase B - Hardened)

**Data**: 2026-10-19  
**Responsável**: Antigravity — Hardening & Technical Assurance  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Inventário Real dos Testes Executados (44 Testes em 5 Suítes)

Comando de Execução Canônico:
```powershell
npm test
```
Saída Oficial Medida:
- **Runner**: Vitest v2.1.9
- **Arquivos de Teste**: 5
- **Total de Testes**: 44
- **Resultado**: 44 aprovados (0 falhas)
- **Tempo de Execução**: ~950ms - 1.1s

### Classificação Estrita por Categoria

| Arquivo de Teste | Quantidade | Classificação Real | Escopo Coberto | O que NÃO Cobre |
|---|---|---|---|---|
| `src/engine/__tests__/musicEngine.test.ts` | 18 | **Unitário** | Conversão científica-MIDI, fórmulas de acordes, perfis Krumhansl-Schmuckler, otimização de dedilhado, validação física e **detecção de fundamental F0 por autocorrelação calibrada (A4 440Hz, A2 110Hz, ruído/silêncio)** | **Não cobre** transcrição polifônica densa de múltiplos instrumentos simultâneos |
| `src/engine/__tests__/connectors.test.ts` | 7 | **Unitário** | Validação estrita de URLs do YouTube (padrão e encurtada), Spotify (faixas), rejeição de formatos inválidos e **defesa contra SSRF (IPs de nuvem, localhost, redes privadas)** | **Não cobre** download de streams de áudio (proibido por TOS) |
| `src/server/__tests__/accessStateMachine.test.ts` | 8 | **Unitário** | Regras de transição de estado de acesso, injeção de relógio simulado, cálculo de 168h do trial, autorização de operações | **Não cobre** chamadas HTTP de rede ou banco de dados |
| `src/server/__tests__/dbConcurrency.test.ts` | 1 | **Integração / Concorrência** | **Fila de mutex assíncrono e persistência atômica com arquivos temporários únicos sob 10 gravações simultâneas paralelas sem corrupção ou perda de registros** | **Não cobre** distribuição multi-servidor em cluster |
| `src/server/__tests__/serverIntegration.test.ts` | 10 | **Integração de API** (In-Process HTTP) | Endpoints `/api/health`, `/api/entitlement/status`, `/api/auth/register`, `/api/songs`, isolamento de segurança entre usuários, **bloqueio de ativação não faturada de planos pagos (402) e resolução segura de conectores externos** | **Não cobre** navegação real em navegador com renderização WebGL |

---

## 2. Detalhamento dos 44 Testes Executados

### A. Motor Musical (`musicEngine.test.ts`) — 18 Testes
1. `converte notas científicas em números MIDI canônicos` [PASS]
2. `converte MIDI de volta para notas científicas (sustenidos e bemóis)` [PASS]
3. `reconhece enarmonia estrita` [PASS]
4. `converte frequências físicas para números MIDI e vice-versa` [PASS]
5. `mapeia posições válidas de corda e casa na guitarra padrão` [PASS]
6. `calcula o número MIDI a partir de corda e casa` [PASS]
7. `reconhece tríade de Dó Maior (C, E, G)` [PASS]
8. `reconhece acorde Menor com Sétima (Am7: A, C, E, G)` [PASS]
9. `detecta C Maior a partir de perfil tonal representativo` [PASS]
10. `otimiza frase melódica favorecendo posições ergonômicas e cordas soltas` [PASS]
11. `aprova notas dentro dos limites físicos do instrumento` [PASS]
12. `rejeita casas impossíveis que excedem o braço físico` [PASS]
13. `rejeita cordas inválidas (ex: corda 7 em violão de 6 cordas)` [PASS]
14. `detecta conflitos temporais de notas simultâneas na mesma corda` [PASS]
15. `calcula envelope RMS e detecta pulso regular em sinal sintético` [PASS]
16. `estima pitch de senoide pura de 440Hz (A4) com alta clareza` [PASS]
17. `estima pitch de senoide pura de 110Hz (A2, corda A grave)` [PASS]
18. `rejeita ruído aleatório ou silêncio sem identificar falsa nota fundamental` [PASS]

### B. Conectores Externos & Segurança SSRF (`connectors.test.ts`) — 7 Testes
19. `Aceita e extrai metadados de URL padrão do YouTube (watch?v=)` [PASS]
20. `Aceita e extrai metadados de URL encurtada do YouTube (youtu.be/)` [PASS]
21. `Aceita e extrai metadados de faixa oficial do Spotify (open.spotify.com/track/)` [PASS]
22. `Bloqueia tentativa de SSRF contra metadados de cloud (169.254.169.254)` [PASS]
23. `Bloqueia tentativa de SSRF contra localhost / 127.0.0.1` [PASS]
24. `Rejeita domínios não suportados` [PASS]
25. `Rejeita IDs de YouTube com formato inválido` [PASS]

### C. Concorrência de Persistência (`dbConcurrency.test.ts`) — 1 Teste
26. `Suporta 10 gravações simultâneas sem corromper JSON ou perder registros` [PASS]

### D. Máquina de Estados e Entitlement (`accessStateMachine.test.ts`) — 8 Testes
27. `permite que visitante execute a primeira utilização gratuita` [PASS]
28. `bloqueia segunda utilização para visitante que já consumiu a cota gratuita` [PASS]
29. `inicializa o trial de 7 dias (168 horas) com timestamps UTC precisos` [PASS]
30. `autoriza usuário durante o período de trial ativo` [PASS]
31. `bloqueia usuário imediatamente após 168 horas (expiração no servidor)` [PASS]
32. `alteração do relógio do cliente NÃO afeta a autorização no servidor` [PASS]
33. `bloqueia contas com status suspenso` [PASS]
34. `autoriza usuário com assinatura Pro ativa respeitando limites mensais` [PASS]

### E. Integração de API HTTP (`serverIntegration.test.ts`) — 10 Testes
35. `GET /api/health retorna 200 e status saudável` [PASS]
36. `Visitante anônimo possui 1 uso gratuito disponível` [PASS]
37. `Visitante executa com sucesso sua única conversão gratuita` [PASS]
38. `Segunda conversão como visitante é BLOQUEADA pelo servidor com 403` [PASS]
39. `Cadastro de usuário ativa trial de 7 dias e emite token de sessão` [PASS]
40. `Usuário em trial ativo consegue executar conversões de música` [PASS]
41. `GET /api/songs suporta paginação e filtros reais` [PASS]
42. `Isolamento de segurança: usuário comum não pode excluir música de outro usuário` [PASS]
43. `POST /api/connectors/resolve valida links externos e bloqueia SSRF` [PASS]
44. `POST /api/plans/select rejeita ativação de plano pago sem gateway real (402)` [PASS]

---

## 3. Status das Lacunas Anteriores

- **[RESOLVIDO] DEF-P0-01 (Detecção de Pitch Real)**: Implementado `estimatePitchAutocorrelation` com interpolação parabólica e integrado ao `conversionService.ts`. Validado com testes de referência.
- **[RESOLVIDO] DEF-P0-02 (Validação de Mídia MP3/MP4)**: Restrições de tamanho (máx 30MB), duração (máx 600s), detecção de arquivos vazios (0 bytes) e captura de erros de codec com mensagens explícitas ao usuário.
- **[RESOLVIDO] DEF-P0-03 (Concorrência de Persistência)**: Implementado mutex em fila de Promise e geração de arquivos temporários únicos com sufixo `process.pid + timestamp + random` para atomicidade em disco.
- **[RESOLVIDO] DEF-P0-04 (Seleção de Planos sem Cobrança)**: Bloqueada atribuição arbitrária de planos pagos no servidor; retorna código 402 explícito indicando que o gateway está em homologação.
- **[RESOLVIDO] DEF-P0-05 (Conectores Externos & SSRF)**: Validação estrita de URLs do YouTube e Spotify, bloqueio categórico de IPs privados e metadados de nuvem, e transparência quanto à necessidade de áudio autorizado.
