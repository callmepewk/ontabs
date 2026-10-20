# OnTabs — Evidências de Testes e Linha de Base Reproduzível (Phase 0/1 - Extended)

**Data**: 2026-10-19  
**Responsável**: Antigravity — Hardening & Technical Assurance  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Inventário Real dos Testes Executados (69 Testes em 7 Suítes)

Comando de Execução Canônico:
```powershell
npm test
```
Saída Oficial Medida:
- **Runner**: Vitest v2.1.9
- **Arquivos de Teste**: 7
- **Total de Testes**: 69
- **Resultado**: 69 aprovados (100% PASS, 0 falhas)
- **Tempo de Execução**: ~1.0s - 1.2s

### Classificação Estrita por Categoria

| Arquivo de Teste | Quantidade | Classificação Real | Escopo Coberto | O que NÃO Cobre |
|---|---|---|---|---|
| `src/engine/__tests__/collectiveArrangement.test.ts` | 13 | **Unitário (CAI & Multi-Inst)** | **Inteligência de arranjo coletivo (Double Guitar lead/rhythm, uníssonos, oitavas, harmonizações, complementos rítmicos), Arrangement Map, adaptação multi-instrumental (baixo, saxofone, bateria) e Active Listener pedagógico (afinador em cents, inversões sem julgamento)** | **Não cobre** separação por modelos neurais pesados de múltiplos GB |
| `src/engine/__tests__/audioAndBand.test.ts` | 12 | **Unitário & Integração de Domínio** | **Equalizador 5-Bandas (80Hz a 8kHz), Presets de Estudo (Guitar Clarity, Bass Definition, Vocal Cut), Stems Mixer (Solo/Mute/Ganho proporcional) e Gestão de Setlists de Banda (Reordenação, Cues de palco e transições de afinação)** | **Não cobre** DSP de hardware analógico externo |
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

### B. Equalizador, Stems e Banda (`audioAndBand.test.ts`) — 12 Testes
14. `Possui exatamente 5 bandas cobrindo sub, graves, médios e agudos (80Hz - 8kHz)` [PASS]
15. `Preset "guitar_clarity" atenua subgraves e destaca médios-agudos (3.5kHz)` [PASS]
16. `Preset "bass_definition" reforça a fundamental grave (80Hz e 300Hz)` [PASS]
17. `Preset "vocal_cut" atenua fortemente a região vocal (1kHz)` [PASS]
18. `Inicializa com 5 canais padrão (Vocais, Bateria, Baixo, Outros, Mix)` [PASS]
19. `Em modo normal sem Solo/Mute, todos os canais possuem ganho proporcional ao volume` [PASS]
20. `Quando um canal está em Solo, apenas os canais em Solo produzem áudio` [PASS]
21. `Canal Muted tem ganho 0 mesmo se estiver marcado com Solo` [PASS]
22. `Cria setlist vazio com id e timestamps válidos` [PASS]
23. `Adiciona música ao setlist com notas de palco e afinação` [PASS]
24. `Reordena músicas do setlist corretamente` [PASS]
25. `Detecta transições de afinação entre faixas consecutivas no repertório` [PASS]

### C. Motor Musical & DSP (`musicEngine.test.ts`) — 18 Testes
26. `converte notas científicas em números MIDI canônicos` [PASS]
27. `converte MIDI de volta para notas científicas (sustenidos e bemóis)` [PASS]
28. `reconhece enarmonia estrita` [PASS]
29. `converte frequências físicas para números MIDI e vice-versa` [PASS]
30. `mapeia posições válidas de corda e casa na guitarra padrão` [PASS]
31. `calcula o número MIDI a partir de corda e casa` [PASS]
32. `reconhece tríade de Dó Maior (C, E, G)` [PASS]
33. `reconhece acorde Menor com Sétima (Am7: A, C, E, G)` [PASS]
34. `detecta C Maior a partir de perfil tonal representativo` [PASS]
35. `otimiza frase melódica favorecendo posições ergonômicas e cordas soltas` [PASS]
36. `aprova notas dentro dos limites físicos do instrumento` [PASS]
37. `rejeita casas impossíveis que excedem o braço físico` [PASS]
38. `rejeita cordas inválidas (ex: corda 7 em violão de 6 cordas)` [PASS]
39. `detecta conflitos temporais de notas simultâneas na mesma corda` [PASS]
40. `calcula envelope RMS e detecta pulso regular em sinal sintético` [PASS]
41. `estima pitch de senoide pura de 440Hz (A4) com alta clareza` [PASS]
42. `estima pitch de senoide pura de 110Hz (A2, corda A grave)` [PASS]
43. `rejeita ruído aleatório ou silêncio sem identificar falsa nota fundamental` [PASS]

### D. Conectores Externos & Segurança SSRF (`connectors.test.ts`) — 7 Testes
44. `Aceita e extrai metadados de URL padrão do YouTube (watch?v=)` [PASS]
45. `Aceita e extrai metadados de URL encurtada do YouTube (youtu.be/)` [PASS]
46. `Aceita e extrai metadados de faixa oficial do Spotify (open.spotify.com/track/)` [PASS]
47. `Bloqueia tentativa de SSRF contra metadados de cloud (169.254.169.254)` [PASS]
48. `Bloqueia tentativa de SSRF contra localhost / 127.0.0.1` [PASS]
49. `Rejeita domínios não suportados` [PASS]
50. `Rejeita IDs de YouTube com formato inválido` [PASS]

### E. Concorrência de Persistência (`dbConcurrency.test.ts`) — 1 Teste
51. `Suporta 10 gravações simultâneas sem corromper JSON ou perder registros` [PASS]

### F. Máquina de Estados e Entitlement (`accessStateMachine.test.ts`) — 8 Testes
52. `permite que visitante execute a primeira utilização gratuita` [PASS]
53. `bloqueia segunda utilização para visitante que já consumiu a cota gratuita` [PASS]
54. `inicializa o trial de 7 dias (168 horas) com timestamps UTC precisos` [PASS]
55. `autoriza usuário durante o período de trial ativo` [PASS]
56. `bloqueia usuário imediatamente após 168 horas (expiração no servidor)` [PASS]
57. `alteração do relógio do cliente NÃO afeta a autorização no servidor` [PASS]
58. `bloqueia contas com status suspenso` [PASS]
59. `autoriza usuário com assinatura Pro ativa respeitando limites mensais` [PASS]

### G. Integração de API HTTP (`serverIntegration.test.ts`) — 10 Testes
60. `GET /api/health retorna 200 e status saudável` [PASS]
61. `Visitante anônimo possui 1 uso gratuito disponível` [PASS]
62. `Visitante executa com sucesso sua única conversão gratuita` [PASS]
63. `Segunda conversão como visitante é BLOQUEADA pelo servidor com 403` [PASS]
64. `Cadastro de usuário ativa trial de 7 dias e emite token de sessão` [PASS]
65. `Usuário em trial ativo consegue executar conversões de música` [PASS]
66. `GET /api/songs suporta paginação e filtros reais` [PASS]
67. `Isolamento de segurança: usuário comum não pode excluir música de outro usuário` [PASS]
68. `POST /api/connectors/resolve valida links externos e bloqueia SSRF` [PASS]
69. `POST /api/plans/select rejeita ativação de plano pago sem gateway real (402)` [PASS]

---

## 3. Matriz de Cobertura de Requisitos

- **Collective Arrangement Intelligence (Annex ONTABS-ANNEX-COLLECTIVE-MUSIC-001)**: 13 testes dedicados cobrindo `UNISON`, `OCTAVE_DOUBLING`, `HARMONIZED`, `RHYTHMIC_COMPLEMENT`, Double Guitar Lead/Rhythm inference, Arrangement Map transitions, adaptação instrumental e Active Listener não punitivo.
- **Equalizador & Stems de Estudo**: 5 bandas (80Hz, 300Hz, 1kHz, 3.5kHz, 8kHz), presets de estudo, stems multicanal solo/mute e setlists de banda com detecção de afinação.
- **Fundamental Pitch ($F_0$)**: Calibrado com senoides de referência em 440Hz e 110Hz.
- **SSRF Shield**: Bloqueio ativo de IPs de cloud (`169.254.x`) e rede privada.
- **Persistence Mutex**: 10 gravações simultâneas concorrentes com zero perda de dados.
- **Server Entitlements**: Trial de 168h e bloqueio 402 em planos pagos sem faturamento.

---

## 4. Gap Finder & Cross-Checker Automatizado (`scripts/gapFinder.ts`)

Execução via `npm run gap-check`:
- **Rotas de Backend Mapeadas**: 15 endpoints (`/api/health`, `/api/auth/*`, `/api/entitlement/*`, `/api/plans/*`, `/api/connectors/*`, `/api/songs*`, `/api/music/*`, `/api/tabs*`, `/api/practice*`, `/api/setlists*`).
- **Rotas de Frontend Registradas**: 16 rotas no React Router (`/`, `/converter`, `/app/importar`, `/play`, `/play/:songId`, `/library`, `/app/biblioteca`, `/setlists`, `/app/setlists`, `/tab/:id`, `/app/tab/:id`, `/planos`, `/login`, `/register`, `/settings`, `/configuracoes`).
- **Módulos do Music Engine**: 15 módulos TypeScript.
- **Gaps Não Testados**: 0 módulos órfãos. Status: **PASSED**.
