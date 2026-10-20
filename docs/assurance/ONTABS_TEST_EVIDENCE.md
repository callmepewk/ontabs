# OnTabs — Evidências de Testes e Linha de Base Reproduzível (119 Testes em 11 Suítes)

**Data**: 2026-10-19  
**Responsável**: Antigravity — Hardening & Technical Assurance  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Inventário Real dos Testes Executados (119 Testes em 11 Suítes)

Comando de Execução Canônico:
```powershell
npm test -- --run
```
Saída Oficial Medida:
- **Runner**: Vitest v2.1.9
- **Arquivos de Teste**: 11
- **Total de Testes**: 119
- **Resultado**: 119 aprovados (100% PASS, 0 falhas)
- **Tempo de Execução**: ~1.4s

### Classificação Estrita por Categoria

| Arquivo de Teste | Quantidade | Classificação Real | Escopo Coberto | O que NÃO Cobre |
|---|---|---|---|---|
| `src/engine/__tests__/mathAndDijkstra.test.ts` | 19 | **Matemático & Prova de Otimização** | **Conversão frequência-MIDI, cálculo de cents Ellis, invariante de oitava (12 semitons = 2x), reversibilidade f->midi->f, F0 por autocorrelação calibrada (A4, A2, A3), rejeição de ruído/silêncio, prova de Dijkstra com oráculo de busca exaustiva independente, resposta analítica de biquad filters e sanitização de ganhos** | Não modela acústica não-linear de salas |
| `src/engine/__tests__/techniquesAndEvents.test.ts` | 13 | **Unitário & DSP de Articulação** | **Modelo canônico versionado de eventos (`CanonicalMusicalEvent`), validação física de trastes/cordas, quantização musical (1/16, tercinas), conversão para compassos/tempos/ticks, taxonomia de técnicas multi-instrumento (Guitarra, Baixo, Bateria, Saxofone), detecção de bends e vibrato por zero-crossing de F0, acordes estendidos (maj9, m7b5), inversões slash chords e cálculo de ambiguidade harmônica** | Não substitui anotação manual com partitura orquestral completa |
| `src/features/play/__tests__/playEngine.test.ts` | 9 | **Unitário & Simulação de Gameplay** | **Janelas de julgamento (Perfect <= 35ms / Pro <= 25ms, Great, Good, Miss), streak e multiplicadores de combo (1x, 2x, 3x, 4x), fórmula de precisão e pontuação, proveniência e regras do ChartGenerator (densidade por dificuldade, acordes em expert vs simplificação em easy)** | Não simula latência de driver de áudio Bluetooth no SO do cliente |
| `src/server/__tests__/adminAuthorization.test.ts` | 8 | **Segurança & Autorização Server-Side** | **Acesso ilimitado de admin após expiração de trial (168h), bloqueio de auto-promoção de role em cadastro, proteção de endpoints administrativos (/api/admin/metrics), bootstrap seguro via chave secreta, imunidade a limites de cota comercial, revogação de privilégios e persistência atômica** | Não substitui auditoria SOC 2 formal |
| `src/engine/__tests__/collectiveArrangement.test.ts` | 13 | **Unitário (CAI & Multi-Inst)** | **Inteligência de arranjo coletivo (Double Guitar lead/rhythm, uníssonos, oitavas, harmonizações, complementos rítmicos), Arrangement Map, adaptação multi-instrumental (baixo, saxofone, bateria) e Active Listener pedagógico (afinador em cents, inversões sem julgamento)** | Não cobre separação por modelos neurais pesados de múltiplos GB |
| `src/engine/__tests__/audioAndBand.test.ts` | 12 | **Unitário & Integração de Domínio** | **Equalizador 5-Bandas (80Hz a 8kHz), Presets de Estudo (Guitar Clarity, Bass Definition, Vocal Cut), Stems Mixer (Solo/Mute/Ganho proporcional) e Gestão de Setlists de Banda (Reordenação, Cues de palco e transições de afinação)** | Não cobre DSP de hardware analógico externo |
| `src/engine/__tests__/musicEngine.test.ts` | 18 | **Unitário** | Conversão científica-MIDI, fórmulas de acordes, perfis Krumhansl-Schmuckler, otimização de dedilhado, validação física e detecção de fundamental F0 | Não cobre transcrição polifônica densa de mixagens completas |
| `src/engine/__tests__/connectors.test.ts` | 7 | **Unitário** | Validação estrita de URLs do YouTube (padrão e encurtada), Spotify (faixas), rejeição de formatos inválidos e **defesa contra SSRF (IPs de nuvem, localhost, redes privadas)** | Não cobre download de streams de áudio (proibido por TOS) |
| `src/server/__tests__/accessStateMachine.test.ts` | 8 | **Unitário** | Regras de transição de estado de acesso, injeção de relógio simulado, cálculo de 168h do trial, autorização de operações | Não cobre chamadas HTTP de rede ou banco de dados |
| `src/server/__tests__/dbConcurrency.test.ts` | 1 | **Integração / Concorrência** | **Fila de mutex assíncrono e persistência atômica com arquivos temporários únicos sob 10 gravações simultâneas paralelas com tolerância a locks no Windows** | Não cobre distribuição multi-servidor em cluster |
| `src/server/__tests__/serverIntegration.test.ts` | 11 | **Integração de API & SPA** (In-Process HTTP) | Endpoints `/api/health`, `/api/entitlement/status`, `/api/auth/register`, `/api/songs`, isolamento de segurança entre usuários, **bloqueio de ativação não faturada de planos pagos (402), resolução de conectores externos e entrega estática de SPA (HTTP 200)** | Não cobre testes visuais em browsers com WebGL |

---

## 2. Detalhamento das Novas Suítes de Teste

### A. Modelo Canônico, Técnicas & DSP de Articulação (`techniquesAndEvents.test.ts`) — 13 Testes
1. `valida evento canônico válido de guitarra com sucesso` [PASS]
2. `rejeita evento com limites físicos violados (fret 28, velocity 150, confiança negativa)` [PASS]
3. `exige drumPiece para eventos percussivos de bateria` [PASS]
4. `rejeita técnica de slap em saxofone ou embocadura em bateria` [PASS]
5. `quantiza timestamps corretamente para a grade de semicolcheia (1/16)` [PASS]
6. `converte segundos em compasso, tempo e tick (PPQ 480)` [PASS]
7. `converte CanonicalMusicalEvents para TabNoteEvents consolidados` [PASS]
8. `possui catálogo completo com símbolos de tablatura e notação` [PASS]
9. `detecta Bend de corda (+1 tom / +2 semitons) a partir da trajetória de F0` [PASS]
10. `detecta Vibrato periódico (oscilação a ~5 Hz) com profundidade em cents` [PASS]
11. `reconhece acordes estendidos: Cmaj9, D7sus4 e Bm7b5` [PASS]
12. `identifica acordes invertidos / slash chords (ex: D com baixo em F# -> D/F#)` [PASS]
13. `calcula ratio de ambiguidade harmônica para conjuntos polissêmicos (C6 vs Am7)` [PASS]

### B. OnTabs Play — Janelas de Julgamento & GameEngine (`playEngine.test.ts`) — 9 Testes
1. `classifica Perfect dentro da janela padrão (<= 35ms)` [PASS]
2. `classifica Great entre 36ms e 70ms` [PASS]
3. `classifica Good entre 71ms e 120ms` [PASS]
4. `ignora toque prematuro fora da janela máxima de hit (> 160ms)` [PASS]
5. `registra Miss automático quando a nota ultrapassa a janela de miss no tick` [PASS]
6. `respeita janelas estritas Pro configuradas (Perfect <= 25ms, Great <= 50ms)` [PASS]
7. `avança multiplicadores: 1x (0-9), 2x (10-19), 3x (20-29), 4x (30+) e zera no Miss` [PASS]
8. `gera GameChart determinístico e preserva acordes em modo Expert` [PASS]
9. `simplifica acordes para notas únicas em modo Easy` [PASS]

---

## 3. Comprovação de Execução Limpa

```
Test Files  11 passed (11)
     Tests  119 passed (119)
  Start at  21:55:59
  Duration  1.45s
```
Status de Garantia Técnica: **100% APROVADO**.
