# OnTabs — Evidências de Testes e Linha de Base Reproduzível (136 Testes em 14 Suítes)

**Data**: 2026-10-19  
**Responsável**: Antigravity — Hardening & Technical Assurance  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Inventário Real dos Testes Executados (136 Testes em 14 Suítes)

Comando de Execução Canônico:
```powershell
npm test -- --run
```
Saída Oficial Medida:
- **Runner**: Vitest v2.1.9
- **Arquivos de Teste**: 14
- **Total de Testes**: 136
- **Resultado**: 136 aprovados (100% PASS, 0 falhas)
- **Tempo de Execução**: ~1.9s

### Classificação Estrita por Categoria

| Arquivo de Teste | Quantidade | Classificação Real | Escopo Coberto | O que NÃO Cobre |
|---|---|---|---|---|
| `src/engine/__tests__/mathAndDijkstra.test.ts` | 19 | **Matemático & Prova de Otimização** | **Conversão frequência-MIDI, cálculo de cents Ellis, invariante de oitava (12 semitons = 2x), reversibilidade f->midi->f, F0 por autocorrelação calibrada (A4, A2, A3), rejeição de ruído/silêncio, prova de Dijkstra com oráculo de busca exaustiva independente, resposta analítica de biquad filters e sanitização de ganhos** | Não modela acústica não-linear de salas |
| `src/engine/__tests__/f0StressAndAcoustics.test.ts` | 6 | **Estresse Acústico & Limites de F0** | **Rastreamento de F0 com múltiplos harmônicos fortes (corda de guitarra), estabilidade sob ruído aditivo (SNR ~18 dB), corte de baixíssima energia (RMS < 0.005), comprovação do limite acústico em sinal polifônico denso (tríade C-E-G), histerese de Schmitt trigger contra micro-jitter e detecção de vibrato legítimo** | Não cobre separação de stems por redes neurais de grande porte |
| `src/engine/__tests__/techniquesAndEvents.test.ts` | 13 | **Unitário & DSP de Articulação** | **Modelo canônico versionado de eventos (`CanonicalMusicalEvent`), validação física de trastes/cordas, quantização musical (1/16, tercinas), conversão para compassos/tempos/ticks, taxonomia de técnicas multi-instrumento (Guitarra, Baixo, Bateria, Saxofone), detecção de bends e vibrato por zero-crossing de F0 com histerese, acordes estendidos (maj9, m7b5), inversões slash chords e cálculo de ambiguidade harmônica** | Não substitui anotação manual com partitura orquestral completa |
| `src/engine/__tests__/electricBass.test.ts` | 8 | **Unitário & Engenharia de Contrabaixo** | **Modelagem idiomática de contrabaixo elétrico convencional (distinto do upright acústico); afinações 4 cordas (E1 41.2Hz), 5 cordas (B0 30.87Hz), 6 cordas (C3 130.81Hz) e Drop D; cálculo de posições no braço (casas 0 a 24); otimização de digitações por caminho mínimo favorecendo casas graves 1-7; detecção de notas fantasma (ghost notes < 60ms); alertas de extensão física; validação estrita de integridade de stems (desvio temporal <= 25ms, sample rate, clipping) e rejeição taxonômica do stem "other" rotulado indevidamente como guitarra isolada** | Não cobre técnicas de slap em contrabaixo acústico com arco |
| `src/engine/__tests__/audioRealityRunner.test.ts` | 2 | **Integração de Áudio Real & TOS** | **Execução ponta a ponta do Audio Reality Runner comparando Track A (Spotify URL oficial com resolução de metadados e restrição `METADATA_ONLY` sem rip de áudio DRM) e Track B (pipeline de áudio real de banda com decodificação PCM, RMS, Peak, BPM por fluxo, separação de stems e transcrição multitrack com status PASS)** | Não baixa áudio protegido por DRM do Spotify |
| `src/features/play/__tests__/playEngine.test.ts` | 9 | **Unitário & Simulação de Gameplay** | **Janelas de julgamento (Perfect <= 35ms / Pro <= 25ms, Great, Good, Miss), streak e multiplicadores de combo (1x, 2x, 3x, 4x), fórmula de precisão e pontuação, proveniência e regras do ChartGenerator (densidade por dificuldade, acordes em expert vs simplificação em easy)** | Não simula latência de driver de áudio Bluetooth no SO do cliente |
| `src/server/__tests__/adminAuthorization.test.ts` | 8 | **Segurança & Autorização Server-Side** | **Acesso ilimitado de admin após expiração de trial (168h), bloqueio de auto-promoção de role em cadastro, proteção de endpoints administrativos (/api/admin/metrics), bootstrap seguro via chave secreta, imunidade a limites de cota comercial, revogação de privilégios e persistência atômica** | Não substitui auditoria SOC 2 formal |
| `src/engine/__tests__/collectiveArrangement.test.ts` | 13 | **Unitário (CAI & Multi-Inst)** | **Inteligência de arranjo coletivo (Double Guitar lead/rhythm, uníssonos, oitavas, harmonizações, complementos rítmicos), Arrangement Map, adaptação multi-instrumental (baixo, saxofone, bateria) e Active Listener pedagógico (afinador em cents, inversões sem julgamento)** | Não cobre separação por modelos neurais pesados de múltiplos GB |
| `src/engine/__tests__/audioAndBand.test.ts` | 12 | **Unitário & Integração de Domínio** | **Equalizador 5-Bandas (80Hz a 8kHz), Presets de Estudo (Guitar Clarity, Bass Definition, Vocal Cut), Stems Mixer (Solo/Mute/Ganho proporcional) e Gestão de Setlists de Banda (Reordenação, Cues de palco e transições de afinação)** | Não cobre DSP de hardware analógico externo |
| `src/engine/__tests__/musicEngine.test.ts` | 18 | **Unitário** | Conversão científica-MIDI, fórmulas de acordes, perfis Krumhansl-Schmuckler, otimização de dedilhado, validação física e detecção de fundamental F0 | Não cobre transcrição polifônica densa de mixagens completas |
| `src/engine/__tests__/connectors.test.ts` | 7 | **Unitário** | Validação estrita de URLs do YouTube (padrão e encurtada), Spotify (faixas canônicas e com prefixos regionais `/intl-pt/track/`), metadados enriquecidos, rejeição de formatos inválidos e **defesa contra SSRF (IPs de nuvem, localhost, redes privadas)** | Não cobre download de streams de áudio (proibido por TOS) |
| `src/server/__tests__/accessStateMachine.test.ts` | 8 | **Unitário** | Regras de transição de estado de acesso, injeção de relógio simulado, cálculo de 168h do trial, autorização de operações | Não cobre chamadas HTTP de rede ou banco de dados |
| `src/server/__tests__/dbConcurrency.test.ts` | 1 | **Integração / Concorrência** | **Fila de mutex assíncrono e persistência atômica com arquivos temporários únicos sob 10 gravações simultâneas paralelas com tolerância a locks no Windows** | Não cobre distribuição multi-servidor em cluster |
| `src/server/__tests__/serverIntegration.test.ts` | 12 | **Integração de API & SPA** (In-Process HTTP) | Endpoints `/api/health`, `/api/entitlement/status`, `/api/auth/register`, `/api/songs`, isolamento de segurança entre usuários, **bloqueio de ativação não faturada de planos pagos (402), resolução de conectores externos, entrega estática de SPA (HTTP 200) e conversão honesta de áudio silencioso (zero notas fabricadas)** | Não substitui auditoria de penetração de rede externa |

---

## 2. Auditoria E2E & Realidade Visual (Playwright com Microsoft Edge) — 7/7 Aprovados

Executado via `scripts/realityE2E.ts`:
1. **Landing Page Comercial**: Hero headline validado, CTA ativo, proposta de valor de engenharia musical.
2. **Resolução de Link Spotify (`1hIQPCM3oWXrpnXmgTDaKG`)**: Resolução com sucesso de *Can't You Hear Me Knocking* (*The Rolling Stones - Sticky Fingers*), exibição transparente do badge `METADATA_ONLY` e explicação da conformidade legal.
3. **Biblioteca de Músicas**: Navegação de catálogo com suporte a filtros e paginação.
4. **OnTabs Play Mode**: Rastreamento e distinção estrita de proveniência (`[DEMO SINTÉTICA]` vs notas reais extraídas).
5. **Planos Comerciais**: Apresentação de Free Trial (7 dias), Starter, Pro e Studio Band.
6. **Mobile Responsividade**: Viewport 375x812 com 0px de horizontal overflow.
7. **Mobile Converter**: Layout mobile responsivo e utilizável sem quebras de layout.

Relatório oficial gravado em `docs/assurance/reality_e2e_report.json`.

---

## 3. Relatório Operacional de Realidade Acústica (Track A & Track B)

Executado via `scripts/audioRealityRunner.ts`:
- **Track A (Spotify)**: Faixa *The Rolling Stones - Can't You Hear Me Knocking* resolvida como `METADATA_ONLY` com conformidade de termos estritamente preservada.
- **Track B (Audio Pipeline Real)**: Áudio multitrack de banda decodificado (44.1kHz, 8s), RMS 0.2056, pico 0.9500 sem clipping, BPM estimado em 60 BPM por fluxo espectral, separação de stems validada (alinhamento temporal <= 25ms, distinção de acompanhamento aprovada), contrabaixo elétrico 4 cordas transcrito (8 notas, casas médias 1.4 no braço), guitarra solo otimizada via Dijkstra (custo 3.25), e inferência de Lead vs Rhythm concluída com 82% de confiança.
- **Relatório Oficial**: `docs/assurance/ONTABS_AUDIO_REALITY_REPORT.md` e `docs/assurance/reality_run_report.json`.
