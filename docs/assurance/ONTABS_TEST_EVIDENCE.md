# OnTabs — Evidências de Testes e Linha de Base Reproduzível (Phase 0/1 - Extended)

**Data**: 2026-10-19  
**Responsável**: Antigravity — Hardening & Technical Assurance  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Inventário Real dos Testes Executados (57 Testes em 6 Suítes)

Comando de Execução Canônico:
```powershell
npm test
```
Saída Oficial Medida:
- **Runner**: Vitest v2.1.9
- **Arquivos de Teste**: 6
- **Total de Testes**: 57
- **Resultado**: 57 aprovados (100% PASS, 0 falhas)
- **Tempo de Execução**: ~1.0s - 1.1s

### Classificação Estrita por Categoria

| Arquivo de Teste | Quantidade | Classificação Real | Escopo Coberto | O que NÃO Cobre |
|---|---|---|---|---|
| `src/engine/__tests__/collectiveArrangement.test.ts` | 13 | **Unitário (CAI & Multi-Inst)** | **Inteligência de arranjo coletivo (Double Guitar lead/rhythm, uníssonos, oitavas, harmonizações, complementos rítmicos), Arrangement Map, adaptação multi-instrumental (baixo, saxofone, bateria) e Active Listener pedagógico (afinador em cents, inversões sem julgamento)** | **Não cobre** separação por modelos neurais pesados de múltiplos GB |
| `src/engine/__tests__/musicEngine.test.ts` | 18 | **Unitário** | Conversão científica-MIDI, fórmulas de acordes, perfis Krumhansl-Schmuckler, otimização de dedilhado, validação física e **detecção de fundamental F0 por autocorrelação calibrada (A4 440Hz, A2 110Hz, ruído/silêncio)** | **Não cobre** transcrição polifônica densa de mixagens completas |
| `src/engine/__tests__/connectors.test.ts` | 7 | **Unitário** | Validação estrita de URLs do YouTube (padrão e encurtada), Spotify (faixas), rejeição de formatos inválidos e **defesa contra SSRF (IPs de nuvem, localhost, redes privadas)** | **Não cobre** download de streams de áudio (proibido por TOS) |
| `src/server/__tests__/accessStateMachine.test.ts` | 8 | **Unitário** | Regras de transição de estado de acesso, injeção de relógio simulado, cálculo de 168h do trial, autorização de operações | **Não cobre** chamadas HTTP de rede ou banco de dados |
| `src/server/__tests__/dbConcurrency.test.ts` | 1 | **Integração / Concorrência** | **Fila de mutex assíncrono e persistência atômica com arquivos temporários únicos sob 10 gravações simultâneas paralelas sem corrupção ou perda de registros** | **Não cobre** distribuição multi-servidor em cluster |
| `src/server/__tests__/serverIntegration.test.ts` | 10 | **Integração de API** (In-Process HTTP) | Endpoints `/api/health`, `/api/entitlement/status`, `/api/auth/register`, `/api/songs`, isolamento de segurança entre usuários, **bloqueio de ativação não faturada de planos pagos (402) e resolução segura de conectores externos** | **Não cobre** navegação real em navegador com renderização WebGL |

---

## 2. Detalhamento dos 57 Testes Executados

### A. Inteligência Coletiva & Multi-Instrumental (`collectiveArrangement.test.ts`) — 13 Testes
1. `CAI-002: Identifica UNISON quando duas guitarras tocam a mesma nota no mesmo tempo` [PASS]
2. `CAI-003: Identifica OCTAVE_DOUBLING quando guitarras dobram em oitavas` [PASS]
3. `CAI-003b: Identifica HARMONIZED quando guitarras tocam terças paralelas` [PASS]
4. `CAI-001: Identifica RHYTHMIC_COMPLEMENT quando ataques são alternados` [PASS]
5. `Double Guitar Intelligence: Infere Lead vs. Rhythm baseado em registro e densidade` [PASS]
6. `Arrangement Map: Mapeia intervalos de atividade e transições entre seções` [PASS]
7. `Adapta linha aguda de guitarra para o baixo com transposição de oitava` [PASS]
8. `Adapta para Saxofone Alto (Eb) aplicando transposição de +9 semitons e respiração` [PASS]
9. `Adapta para Bateria mapeando frequências para elementos de Drum Grid (Kick, Snare, Hi-Hat)` [PASS]
10. `Afinador calcula nota exata e desvio em cents para A4 (440Hz)` [PASS]
11. `Afinador detecta desafinação positiva quando frequência está acima` [PASS]
12. `CAI-011: Reconhece inversão harmônica válida (baixo alternativo) sem julgar como erro` [PASS]
13. `CAI-011b: Reconhece variação criativa autoral em vez de emitir mensagem punitiva` [PASS]

### B. Motor Musical & DSP (`musicEngine.test.ts`) — 18 Testes
14. `converte notas científicas em números MIDI canônicos` [PASS]
15. `converte MIDI de volta para notas científicas (sustenidos e bemóis)` [PASS]
16. `reconhece enarmonia estrita` [PASS]
17. `converte frequências físicas para números MIDI e vice-versa` [PASS]
18. `mapeia posições válidas de corda e casa na guitarra padrão` [PASS]
19. `calcula o número MIDI a partir de corda e casa` [PASS]
20. `reconhece tríade de Dó Maior (C, E, G)` [PASS]
21. `reconhece acorde Menor com Sétima (Am7: A, C, E, G)` [PASS]
22. `detecta C Maior a partir de perfil tonal representativo` [PASS]
23. `otimiza frase melódica favorecendo posições ergonômicas e cordas soltas` [PASS]
24. `aprova notas dentro dos limites físicos do instrumento` [PASS]
25. `rejeita casas impossíveis que excedem o braço físico` [PASS]
26. `rejeita cordas inválidas (ex: corda 7 em violão de 6 cordas)` [PASS]
27. `detecta conflitos temporais de notas simultâneas na mesma corda` [PASS]
28. `calcula envelope RMS e detecta pulso regular em sinal sintético` [PASS]
29. `estima pitch de senoide pura de 440Hz (A4) com alta clareza` [PASS]
30. `estima pitch de senoide pura de 110Hz (A2, corda A grave)` [PASS]
31. `rejeita ruído aleatório ou silêncio sem identificar falsa nota fundamental` [PASS]

### C. Conectores Externos & Segurança SSRF (`connectors.test.ts`) — 7 Testes
32. `Aceita e extrai metadados de URL padrão do YouTube (watch?v=)` [PASS]
33. `Aceita e extrai metadados de URL encurtada do YouTube (youtu.be/)` [PASS]
34. `Aceita e extrai metadados de faixa oficial do Spotify (open.spotify.com/track/)` [PASS]
35. `Bloqueia tentativa de SSRF contra metadados de cloud (169.254.169.254)` [PASS]
36. `Bloqueia tentativa de SSRF contra localhost / 127.0.0.1` [PASS]
37. `Rejeita domínios não suportados` [PASS]
38. `Rejeita IDs de YouTube com formato inválido` [PASS]

### D. Concorrência de Persistência (`dbConcurrency.test.ts`) — 1 Teste
39. `Suporta 10 gravações simultâneas sem corromper JSON ou perder registros` [PASS]

### E. Máquina de Estados e Entitlement (`accessStateMachine.test.ts`) — 8 Testes
40. `permite que visitante execute a primeira utilização gratuita` [PASS]
41. `bloqueia segunda utilização para visitante que já consumiu a cota gratuita` [PASS]
42. `inicializa o trial de 7 dias (168 horas) com timestamps UTC precisos` [PASS]
43. `autoriza usuário durante o período de trial ativo` [PASS]
44. `bloqueia usuário imediatamente após 168 horas (expiração no servidor)` [PASS]
45. `alteração do relógio do cliente NÃO afeta a autorização no servidor` [PASS]
46. `bloqueia contas com status suspenso` [PASS]
47. `autoriza usuário com assinatura Pro ativa respeitando limites mensais` [PASS]

### F. Integração de API HTTP (`serverIntegration.test.ts`) — 10 Testes
48. `GET /api/health retorna 200 e status saudável` [PASS]
49. `Visitante anônimo possui 1 uso gratuito disponível` [PASS]
50. `Visitante executa com sucesso sua única conversão gratuita` [PASS]
51. `Segunda conversão como visitante é BLOQUEADA pelo servidor com 403` [PASS]
52. `Cadastro de usuário ativa trial de 7 dias e emite token de sessão` [PASS]
53. `Usuário em trial ativo consegue executar conversões de música` [PASS]
54. `GET /api/songs suporta paginação e filtros reais` [PASS]
55. `Isolamento de segurança: usuário comum não pode excluir música de outro usuário` [PASS]
56. `POST /api/connectors/resolve valida links externos e bloqueia SSRF` [PASS]
57. `POST /api/plans/select rejeita ativação de plano pago sem gateway real (402)` [PASS]

---

## 3. Matriz de Cobertura de Requisitos

- **Collective Arrangement Intelligence (Annex ONTABS-ANNEX-COLLECTIVE-MUSIC-001)**: 13 testes dedicados cobrindo `UNISON`, `OCTAVE_DOUBLING`, `HARMONIZED`, `RHYTHMIC_COMPLEMENT`, Double Guitar Lead/Rhythm inference, Arrangement Map transitions, adaptação instrumental e Active Listener não punitivo.
- **Fundamental Pitch ($F_0$)**: Calibrado com senoides de referência em 440Hz e 110Hz.
- **SSRF Shield**: Bloqueio ativo de IPs de cloud (`169.254.x`) e rede privada.
- **Persistence Mutex**: 10 gravações simultâneas concorrentes com zero perda de dados.
- **Server Entitlements**: Trial de 168h e bloqueio 402 em planos pagos sem faturamento.
