# OnTabs — Estratégia de Validação e Verificação Independente (Phase 0/1)
**Identificador**: ONTABS-SPEC-VAL-001  
**Classificação**: Plano de Testes, Qualidade Contínua e Governança de Validação  
**Data**: 2026-10-19  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Princípios da Estratégia de Validação

A qualidade do OnTabs assenta-se no princípio de que **relatórios de sucesso não substituem evidências reproduzíveis**:
$$\text{REAL STATE} > \text{RUNTIME EVIDENCE} > \text{VERIFIED IMPLEMENTATION} > \text{TEST EVIDENCE} > \text{DOCUMENTATION} > \text{AGENT CLAIM}$$

Nenhum requisito pode ser declarado como pronto sem satisfazer os critérios do seu respectivo nível de validação:
- **Unitário (Nível 1)**: Algoritmos puros de teoria musical, matemática de DSP e regras de negócio sem I/O.
- **Integração de API & Persistência (Nível 2)**: Rotas HTTP, autenticação, controle de concorrência e banco de dados local.
- **Validação de Sinais de Áudio (Nível 3)**: Fixtures acústicas de referência (senoides calibradas, tons de afinação, silêncio e ruído).
- **Inteligência de Arranjo Coletivo (Nível 4 - CAI)**: Fixtures de múltiplas partes (duas guitarras, baixo, bateria, transições de seção).
- **End-to-End em Navegador Real (Nível 5 - E2E)**: Simulação completa de interação do usuário com Chromium via Playwright.

---

## 2. Benchmark de Validação de Arranjo Coletivo (Suíte CAI)

Em estrito atendimento ao **Anexo ONTABS-ANNEX-COLLECTIVE-MUSIC-001**, foram estabelecidos os seguintes 18 casos de teste de referência:

| ID | Cenário de Teste | Entrada do Teste | Critério de Aceite |
|---|---|---|---|
| `CAI-001` | Identificação de padrões rítmicos e melódicos | Pistas de áudio com onsets e contornos distintos | Distinção de linhas sem sobreposição forçada |
| `CAI-002` | Avaliação de possível dobragem de guitarras | Duas pistas com notas idênticas no mesmo tempo | Classificação como `POSSIBLE_DOUBLING` ou `UNISON` |
| `CAI-003` | Distinção de uníssono vs. harmonização | Duas melodias paralelas com intervalo constante de terça | Classificação como `HARMONIZED` |
| `CAI-004` | Relações complementares entre guitarra e baixo | Riff de guitarra com baixo sustentando a tônica | Identificação de papéis (`Riff` vs `Groove`) |
| `CAI-005` | Atividade de bateria indicando transição | Súbito aumento de densidade de onsets percussivos | Marcação de virada (`Fill`) e transição de seção |
| `CAI-006` | Detecção de transições estruturais | Mudança de andamento ou dinâmica na timeline | Timestamp inicial e final registrado no Arrangement Map |
| `CAI-007` | Correção manual de seções e partes | Intervenção do usuário reclassificando uma parte | Estado atualizado como `USER_CONFIRMED` |
| `CAI-008` | Verificação de honestidade na confiança | Sinal ambíguo ou de baixa clareza | Exibição de `UNKNOWN` ou confiança explícita sem invenção |
| `CAI-009` | Suporte a afinações alternativas | Pistas afinadas em Drop D (D2-A2-D3-G3-B3-E4) | Mapeamento correto de casas sem extrapolar braço |
| `CAI-010` | Reconhecimento de acordes polifônicos | Vetor de notas de Am7 (A-C-E-G) | Reconhecimento exato de Am7 com inversões |
| `CAI-011` | Feedback que distingue divergência de erro | Usuário toca voicing de C com baixo em E (C/E) | Active Listener informa inversão válida, sem julgar como erro |
| `CAI-012` | Preservação de arranjos criativos | Modificação de ritmo ou dedilhado pelo usuário | Versão personalizada salva como arranjo autoral |
| `CAI-013` | Alinhamento temporal entre pistas | Stems de guitarra e baixo com tempo comum | Sincronia de playback com deriva zero ($\Delta t < 5\text{ms}$) |
| `CAI-014` | Entradas e saídas de instrumentos | Solo de guitarra entrando no compasso 16 | Timestamp de entrada e saída registrado na pista |
| `CAI-015` | Preparação de setlist de banda | Música com afinações e convenções de palco | Atribuição de papéis (Músico A, B, C) preservada |
| `CAI-016` | Privacidade e cancelamento do microfone | Encerramento da captura do Active Listener | `AudioContext` fechado e stream de microfone liberado |
| `CAI-017` | Mudanças de andamento | Trecho com acelerando ou rubato | Grid adaptativo sem quebra de compassos |
| `CAI-018` | Isolamento de falhas de separação | Stems com vazamento acústico (bleed) | Sistema indica incerteza sem fabricar notas falsas |

---

## 3. Runners Automatizados de Verificação

Os testes do OnTabs são executados através do runner de alta velocidade Vitest:
```powershell
npm test
```
Resultados organizados em suítes especializadas:
1. `src/engine/__tests__/musicEngine.test.ts`: Teoria musical, afinações, acordes, dedilhados e calibração de pitch fundamental.
2. `src/engine/__tests__/connectors.test.ts`: Sanitização de URLs externas, extração de IDs e defesa contra SSRF.
3. `src/engine/__tests__/collectiveArrangement.test.ts`: Módulo de inteligência coletiva (Double Guitar, Arrangement Map, Adaptação).
4. `src/server/__tests__/accessStateMachine.test.ts`: Máquina de estados de degustação, trial de 168h e imunidade a clock tampering.
5. `src/server/__tests__/dbConcurrency.test.ts`: Mutex assíncrono e integridade sob 10 escritas paralelas em disco.
6. `src/server/__tests__/serverIntegration.test.ts`: Endpoints REST, isolamento entre usuários, rejeição de planos pagos não faturados e conectores.
