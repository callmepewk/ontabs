# OnTabs — Matriz de Capacidades Funcionais por Instrumento (Phase 0/1)
**Identificador**: ONTABS-SPEC-CAP-001  
**Classificação**: Garantia Funcional, Auditoria de Capacidades e Verificação Contínua  
**Data**: 2026-10-19  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Classificação das Capacidades do Produto

A tabela abaixo classifica com rigor de engenharia o estado de cada funcionalidade declarada no OnTabs:

| Funcionalidade | Instrumentos Aplicáveis | Estado Atual | O que Realmente Funciona | Limitação Técnica Conhecida | Arquivos Principais |
|---|---|---|---|---|---|
| **Detecção de Pitch Monofônico ($F_0$)** | Guitarra (solos), Baixo, Violão (melodia) | `VERIFIED` | Autocorrelação de domínio temporal com interpolação parabólica e limiar de clareza (testado com A4 440Hz e A2 110Hz). | Funciona para linhas melódicas isoladas; não transcreve polifonia densa ou acordes cheios. | `src/engine/audioAnalysis.ts`, `src/services/conversionService.ts` |
| **Estimativa de BPM & Grid de Batidas** | Todos | `VERIFIED` | Spectral flux derivado de envelope RMS com autocorrelação entre 60 e 190 BPM. | Mudanças bruscas de compasso ou andamentos livres (rubato) geram estimativa média. | `src/engine/audioAnalysis.ts` |
| **Estimativa de Tonalidade** | Todos | `VERIFIED` | Algoritmo Krumhansl-Schmuckler comparando perfis cromáticos para determinar escalas maiores e menores. | Requer amostragem cromática consistente; gravações com afinações microtonais exigem correção. | `src/engine/keyDetection.ts` |
| **Dicionário & Reconhecimento de Acordes** | Guitarra, Violão | `VERIFIED` | Reconhecimento exato de tríades e tétrades a partir de notas ativas. | Reconhece acordes a partir de notas identificadas; a extração polifônica do áudio bruto é aproximada. | `src/engine/chords.ts` |
| **Otimização de Dedilhado (Fret Optimization)** | Guitarra, Baixo, Violão, Ukulele | `VERIFIED` | Função de custo ponderando salto de casas, penalidade de pestana e preferência por cordas soltas. | O algoritmo encontra o caminho ótimo dado um conjunto de notas, mas não conhece o tamanho da mão do usuário. | `src/engine/fretOptimization.ts` |
| **Validação Física de Tablaturas** | Guitarra, Baixo, Violão, Ukulele | `VERIFIED` | Rejeição de casas inexistentes no braço e detecção de sobreposição temporal na mesma corda. | Valida a tocabilidade física do instrumento configurado. | `src/engine/tabValidation.ts` |
| **Conectores de Mídia Externa (YouTube/Spotify)** | Todos | `VERIFIED` | Validação de links, extração de ID, defesa contra SSRF (bloqueio de IPs locais e nuvem) e transparência de capacidades. | Não realiza download de áudio protegido por DRM; orienta o usuário a fornecer arquivo de áudio autorizado. | `src/engine/connectors.ts`, `src/server/routes.ts` |
| **Validação de Ingestão de Áudio (MP3/MP4)** | Todos | `VERIFIED` | Limite de 30MB, duração máxima de 600s, bloqueio de 0 bytes e detecção de falha de decodificação AAC/PCM. | Decodificação executada pelo navegador via Web Audio API. | `src/services/conversionService.ts` |
| **Máquina de Estados de Acesso & Trial 168h** | Todos | `VERIFIED` | 1 uso gratuito anônimo, 168h de trial no cadastro, bloqueio server-side de rotas protegidas e rejeição de clock tampering. | Persistido atomicamente no servidor. | `src/server/accessStateMachine.ts`, `src/server/routes.ts` |
| **Persistência Concorrente Segura** | Todos | `VERIFIED` | Escrita atômica em disco com nomes temporários únicos (`pid + time + salt`) e mutex serializado em Promise. | Adequado para instância única; cluster multi-servidor exigirá banco relacional externo (Postgres). | `src/server/db.ts` |
| **Bloqueio de Pagamento Não Homologado** | Todos | `VERIFIED` | Rejeição com HTTP 402 em `/api/plans/select` para planos pagos, orientando o uso do Trial Pro de 7 dias. | Checkout financeiro (Stripe/Pix) deliberadamente bloqueado até existir credencial real. | `src/server/routes.ts`, `src/pages/PlansPage.tsx` |
| **Representação Musical Intermediária (IR)** | Todos | `IMPLEMENTED` | Estrutura de dados temporal unificada que relaciona tempo, notas, acordes, seções, stems e afinações. | Formato interno implementado para desacoplar a transcrição da apresentação. | `src/engine/intermediateRepresentation.ts` |
| **Double Guitar Intelligence (Duas Guitarras)** | Guitarra Rítmica, Guitarra Solo | `IMPLEMENTED` | Classificação de funções prováveis (Lead, Riff, Rhythm, Textural) e relações (Unison, Harmonized, Octaves, Complement). | Classificação baseada em heurísticas musicais comprovadas; requer separação prévia de stems para gravações densas. | `src/engine/collectiveArrangement.ts` |
| **Arrangement Map & Transições de Seção** | Todos | `IMPLEMENTED` | Mapa temporal unificado das partes ativas da banda e detecção de pontos de transição estrutural. | Transições identificadas por quebras de energia e densidade de onsets; permite ajuste manual pelo usuário. | `src/engine/collectiveArrangement.ts` |
| **Adaptação Instrumental ("Play It Your Way")** | Guitarra, Baixo, Violão, Bateria, Saxofone | `IMPLEMENTED` | Motor de adaptação com perfis de dificuldade (`Beginner`, `Intermediate`, `Advanced`, `Expert`) e transposição de tessitura. | Adaptações respeitam a extensão do instrumento de destino com marcações de oitava alterada. | `src/engine/instrumentArrangement.ts` |
| **Active Listener & Afinador Cromático** | Guitarra, Baixo, Violão | `IMPLEMENTED` | Captura de microfone com consentimento, estimativa de cents para afinação e feedback sem julgamento ("Diferença vs. Erro"). | Processamento 100% no navegador sem persistência contínua não autorizada. | `src/engine/activeListener.ts` |
| **Separação de Stems em Tempo Real** | Vocals, Drums, Bass, Other | `PARTIALLY_VERIFIED` | Arquitetura e player de stems multi-faixa com Solo/Mute especificados; integração local com modelos leves de separação. | Execução de modelos pesados (Demucs 4-stem) requer backend com GPU ou WebAssembly de alto desempenho. | `src/features/play/audioEngine.ts` |
| **Bateria (Drum Grid & Transcrição Percussiva)** | Bateria (Kit completo) | `IMPLEMENTED` | Mapeamento de componentes (Kick, Snare, Hi-Hat, Toms, Cymbals) e visualização em grade rítmica. | Transcrição de áudio real denso exige stem limpo de bateria para evitar falsos positivos com o baixo. | `src/engine/instrumentArrangement.ts` |
| **Saxofone (Partitura Transposta & Respirações)** | Sax Alto (Eb), Sax Tenor (Bb) | `IMPLEMENTED` | Transposição automática de tom de concerto para tom de instrumento e sugestão de pontos de respiração em pausas. | Notação de partitura transposta; não transcreve multifônicos de sopro. | `src/engine/instrumentArrangement.ts` |

---

## 2. Critérios de Transição de Estado

- **DECLARED → IMPLEMENTED**: Código-fonte existe no repositório, tipado e com fluxo identificável.
- **IMPLEMENTED → TESTED**: Coberto por teste unitário ou de integração com fixtures determinísticas.
- **TESTED → VERIFIED**: Validado em condições reais ou de referência de áudio calibrado com evidência reproduzível.
- **VERIFIED → PRODUCTION-READY**: Integrado à UI completa, testado em navegador real (E2E), com segurança auditada e documentação correspondente.
