# OnTabs — Relatório de Reconciliação e Estado Atual do Produto (Phase A)

**Data**: 2026-10-19  
**Responsável**: Antigravity — Hardening & Technical Assurance  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  
**Workspace Local**: `C:\Users\pedro\OneDrive\Desktop\ontabs-app`  
**Referência Publicada**: `https://ontabs.base44.app`  
**Política Operacional**: Túneis encerrados; zero processos de rede persistentes em background; foco estrito em diagnóstico de engenharia, evidências reproduzíveis e hardening funcional.

---

## 1. Sumário Executivo do Estado Real

A auditoria minuciosa da base de código revelou a exata linha divisória entre o que foi **declarado**, o que foi **implementado** e o que foi **efetivamente verificado**:

1. **Reconciliação Git**: O branch local `main` possui 4 commits adiante de `origin/main` (`6f01c2b`, `e583213`, `5fffeed`, `0c74ebb`). O repositório canônico remoto possui governança estabelecida em `.github/CODEOWNERS` apontando para `@callmepewk`. Nenhuma alteração foi enviada para o remoto (`git push` não executado, conforme diretriz).
2. **Gates Técnicos Base**: O build TypeScript (`tsc -b && vite build`) compila sem erros (70 módulos em ~900ms) e o linter (`eslint`) não possui erros de sintaxe.
3. **Realidade da Suíte de Testes (31 testes)**: Os 31 testes executados pelo Vitest são **testes unitários de domínio e testes de integração de API HTTP in-process**. **Nenhum teste E2E real via navegador (Playwright/Puppeteer) foi executado**. Rotular a suíte anterior como "E2E" foi uma imprecisão técnica que este relatório retifica formalmente.
4. **Vulnerabilidade Central de Engenharia Musical (MP3/MP4)**: O pipeline em `src/services/conversionService.ts` calcula corretamente envelope de energia RMS e estimativa de BPM por autocorrelação, mas **a extração de notas (pitch) utilizava uma fórmula sintética (`midi: 60 + ((Math.round(t) * 2) % 16)`)**. Não havia detecção real de frequência fundamental ou transientes polifônicos no áudio ingerido.
5. **Persistência e Concorrência**: O banco de dados em `src/server/db.ts` utiliza escrita atômica em arquivo (`.tmp` seguido de `fs.renameSync`). Embora previna arquivos corrompidos em caso de crash do processo, **não possui controle de concorrência por mutex/locks para requisições assíncronas concorrentes**, o que expõe o sistema a race conditions e perda de atualizações em escritas simultâneas.
6. **Conectores URL (YouTube / Spotify)**: A submissão de link apenas gerava um registro de intenção com título fictício sem consumir APIs oficiais, sem tratar autenticação, sem validar cotas e sem distinguir explicitamente metadados de áudio real autorizado.
7. **Trial e Comercial**: A máquina de estados temporal (`src/server/accessStateMachine.ts`) aplica regras de 168 horas no servidor para conversões protegidas, mas a cobrança e checkout online não possuem integração real com gateway de pagamentos (Stripe/Pix) nem conciliação de webhooks.

---

## 2. Histórico de Commits e Diffs Reconciliados

```
* 0c74ebb (HEAD -> main) feat(ui): decouple frontend services from Base44, add Plans, TabViewer, Auth pages and real library pagination
* 5fffeed feat(server): standalone HTTP backend runtime with 168-hour trial state machine, auth and persistence
* e583213 feat(engine): implement sovereign music engine with note theory, chord detection, fret optimization and tab validation
* 6f01c2b fix(build): repair TypeScript build gates, configure ESLint and add Vitest test runner
* 4d32c41 (origin/main) Merge pull request #1 from callmepewk/chore/governance-codeowners
|\  
| * dd85420 chore(governance): establish canonical CODEOWNERS for sovereign authority
|/  
* 2202348 Initial release - Ontabs
```

### Auditoria Detalhada dos 4 Commits
- `6f01c2b`: Instalou `@types/node` e `vitest`, criou `.eslintrc.cjs`, reparou destruidores no React em `GamepadPanel.tsx`, removeu variáveis não utilizadas em `gameEngine.ts` e ajustou ESM no `vite.config.ts`.
- `e583213`: Adicionou `src/engine/` com 9 arquivos contendo teoria musical básica, afinações de instrumentos (guitarra, violão, baixo, ukulele), detecção de acordes via templates, perfis de Krumhansl-Schmuckler, otimizador de digitação e validação de limites físicos da tablatura, com 15 testes unitários.
- `5fffeed`: Criou o servidor HTTP autônomo em `src/server/`, banco JSON atômico, hashing `scrypt`, rotas REST e máquina de estados com 16 testes de integração/estado.
- `0c74ebb`: Reformulou `src/services/` para consultar a API local, adicionou páginas `PlansPage`, `TabViewerPage`, `LoginPage`, `RegisterPage` e paginação no `LibraryPage`.

---

## 3. Matriz de Classificação de Funcionalidades (Status Rigoroso)

| Funcionalidade | Estado | Código-Fonte | Evidência Existente | Limitação Real / Risco |
|---|---|---|---|---|
| **Compilação TS / Vite** | VERIFIED | `vite.config.ts`, `package.json` | `npm run build` exit code 0 | Módulos empacotam; não prova lógica correta |
| **Linters e Regras de Código** | VERIFIED | `.eslintrc.cjs` | `npm run lint` exit code 0 (0 erros) | Regras mínimas configuradas |
| **Teoria de Notas e Frequências** | VERIFIED | `src/engine/notes.ts` | 6 testes unitários aprovados | Cobre faixa MIDI 0-127 e A440 |
| **Afinações de Instrumentos** | VERIFIED | `src/engine/tunings.ts` | 2 testes unitários aprovados | Guitarra, Baixo, Violão, Ukulele |
| **Reconhecimento de Acordes (Templates)**| VERIFIED | `src/engine/chords.ts` | 2 testes unitários aprovados | Cosseno cromático; requer chroma confiável |
| **Estimativa de Tonalidade (K-S)** | VERIFIED | `src/engine/keyDetection.ts` | 1 teste unitário aprovado | Funciona em distribuições cromáticas pré-calculadas |
| **Otimização de Dedilhado (Fret)** | VERIFIED | `src/engine/fretOptimization.ts` | 1 teste unitário aprovado | Minimização de custo para notas monofônicas já conhecidas |
| **Validação Física de Tablatura** | VERIFIED | `src/engine/tabValidation.ts` | 4 testes unitários aprovados | Detecta casas > 24, cordas inválidas e conflitos temporais |
| **Detecção de BPM (Autocorrelação)** | VERIFIED | `src/engine/audioAnalysis.ts` | 1 teste unitário aprovado | Funciona em batidas com ataque claro entre 60 e 190 BPM |
| **Ingestão Real de MP3/MP4** | **IMPLEMENTED (DEFECTIVE)** | `src/services/conversionService.ts` | N/A | **Defeito Crítico**: notas geradas por fórmula sintética modulo; sem validação de MIME real ou container MP4 |
| **Conector YouTube** | **DECLARED / STUB** | `src/services/musicService.ts` | N/A | Não consulta API oficial; não extrai áudio; sem tratamento de TOS |
| **Conector Spotify** | **NOT IMPLEMENTED** | `src/services/musicService.ts` | N/A | Botão desabilitado na interface; sem fluxo OAuth |
| **Máquina de Estados de Acesso (168h)** | VERIFIED (UNIT/INT) | `src/server/accessStateMachine.ts`| 8 testes unitários aprovados | Regras temporais UTC verificadas em memória |
| **Uso Gratuito de Visitante** | VERIFIED (INT) | `src/server/routes.ts` | 2 testes de integração aprovados | 1 conversão permitida; 2ª bloqueada com 403 |
| **Persistência em Arquivo** | IMPLEMENTED | `src/server/db.ts` | Testes de integração | Atômico via renameSync, mas **sem mutex de concorrência** |
| **Paginação da Biblioteca** | VERIFIED (INT) | `src/server/routes.ts`, `LibraryPage` | Teste de integração de paginação | Retorna `items`, `total`, `page`, `pageSize`, `totalPages` |
| **OnTabs Play (Gameplay)** | IMPLEMENTED | `src/features/play/` | Manual / Código | Roda em canvas 60fps com AudioContext |
| **Gateway de Cobrança / Stripe** | **NOT IMPLEMENTED / BLOCKED** | `src/pages/PlansPage.tsx` | N/A | Exibe planos mas checkout real não está conectado |
| **Navegação End-to-End Real (Browser)** | **UNKNOWN** | UI React | **Zero testes de navegador executados** | Requer suíte com Playwright/Puppeteer |

---

## 4. Defeitos Críticos P0 Identificados

### [DEF-P0-01] Pitch Sintético no Conversor de Áudio
- **Arquivo**: `src/services/conversionService.ts` (linhas 80-86)
- **Problema**: O código gera eventos de nota usando `midi: 60 + ((Math.round(t) * 2) % 16)`.
- **Causa Raiz**: O autor da primeira versão mockou o pitch generator enquanto implementava o cálculo de BPM.
- **Risco**: Falsificação de transcrição musical ao usuário; perda total de credibilidade do produto.
- **Remediação Obrigatória**: Substituir por um estimador de pitch monofônico real baseado em autocorrelação (YIN ou time-domain pitch tracking) ou Goertzel spectral peak finding, com restrição e indicação honesta de que a transcrição atual é monofônica.

### [DEF-P0-02] Ingestão Frágil de MP4 / Codecs de Mídia
- **Arquivo**: `src/services/conversionService.ts` e `src/pages/ConverterPage.tsx`
- **Problema**: O input aceita `video/mp4` e tenta decodificar cegamente via `AudioContext.decodeAudioData()`. Se o arquivo for um MP4 sem faixa de áudio, corrompido ou com codec não suportado pelo navegador (ex: AC3/DTS), o erro é capturado e cai em fallback com notas fictícias.
- **Remediação Obrigatória**: Validação rigorosa no cliente antes de iniciar a decodificação: verificação de tamanho máximo (limite configurável, ex: 25MB), verificação de duração máxima, tratamento explícito de arquivos sem áudio e notificação clara ao usuário caso o formato/codec seja incompatível.

### [DEF-P0-03] Ausência de Mutex de Concorrência na Persistência
- **Arquivo**: `src/server/db.ts`
- **Problema**: `Database.save()` faz escrita síncrona em `.tmp` e `renameSync`, mas a instância `Database` mantém o estado em memória `this.data`. Duas requisições assíncronas concorrentes lendo `this.data` simultaneamente e gravando em sequência sobrescrevem alterações da outra (Race Condition).
- **Remediação Obrigatória**: Implementar um mutex de fila assíncrona (Async Lock / Mutex) em `Database.save()` e `updateUser` para serializar operações de mutação.

### [DEF-P0-04] False Claim de Checkout nos Planos
- **Arquivo**: `src/pages/PlansPage.tsx` e `src/server/routes.ts`
- **Problema**: O endpoint `POST /api/plans/select` altera o `planCode` do usuário imediatamente para `pro` ou `premium` sem qualquer transação financeira ou confirmação de pagamento.
- **Remediação Obrigatória**: Marcar explicitamente na interface e na API que o checkout real está `PENDENTE DE CONFIGURAÇÃO DE GATEWAY (STRIPE/PIX)`. Permitir apenas seleção do plano Free ou visualização informativa dos planos pagos, sem simular que uma assinatura paga foi efetivada.

### [DEF-P0-05] Conector YouTube com Comportamento Enganoso
- **Arquivo**: `src/services/musicService.ts`
- **Problema**: O método `submitYoutubeUrl` enviava a URL para `/api/music/convert` criando uma música com título `Música (https://youtube...)` e gerando tablatura demonstrativa, dando a falsa impressão de que o áudio do YouTube havia sido extraído e analisado.
- **Remediação Obrigatória**: Explicitar o contrato do conector: APIs de streaming protegem o áudio por DRM/TOS. O conector deve oferecer apenas importação de metadados oficiais e solicitar que o usuário forneça seu próprio arquivo de áudio autorizado para análise.
