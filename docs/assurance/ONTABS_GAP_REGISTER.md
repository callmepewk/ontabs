# OnTabs — Registro de Lacunas de Engenharia (Gap Register - Phase 0/1)
**Identificador**: ONTABS-SPEC-GAP-001  
**Classificação**: Gestão de Riscos, Rastreabilidade de Requisitos e Controle de Qualidade  
**Data**: 2026-10-19  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Metodologia de Mapeamento de Gaps

O Gap Register cruza:
$$\text{Requisitos de Produto (PRD)} \iff \text{Código Fonte} \iff \text{Testes Automatizados} \iff \text{Evidências de Runtime}$$

Toda discrepância entre o que foi planejado/declarado e o que foi efetivamente testado e comprovado recebe um identificador estável, severidade e plano de resolução.

---

## 2. Catálogo Oficial de Gaps de Engenharia

| ID do Gap | Área Afetada | Severidade | Descrição do Gap | Estado Atual | Plano de Ação & Mitigação |
|---|---|---|---|---|---|
| **GAP-01** | Separação de Stems | **Alta (P1)** | Modelos neurais pesados de separação (Demucs 4-stem) demandam alta capacidade de processamento que inviabiliza execução instantânea em CPU modesta. | `PARTIALLY_VERIFIED` | Implementar fallback de separação de filtros passa-faixa determinísticos no navegador e preparar worker assíncrono para modelos ML de backend quando houver infraestrutura dedicada. |
| **GAP-02** | Double Guitar Intelligence | **Média (P1)** | Distinguir duas guitarras com timbres parecidos em uma faixa estéreo requer correlação cuidadosa de onsets e espacialização estéreo. | `IMPLEMENTED` *(Módulo de classificação criado)* | Utilizar o novo módulo `collectiveArrangement.ts` com classificação de funções (`Lead`, `Rhythm`, `Riff`) e permitir reclassificação manual pelo usuário. |
| **GAP-03** | Interface do Arrangement Map | **Média (P1)** | O visualizador atual de tablaturas (`TabViewerPage.tsx`) exibe apenas uma pista de tablatura simples por vez, sem a visão multi-pistas da banda toda. | `IMPLEMENTED` *(Backend/Engine)*; `PENDING` *(UI)* | Criar o componente visual de pistas de arranjo com timeline sincronizada, seletor de solo/mute e marcadores de transição de seção. |
| **GAP-04** | Active Listener com Microfone | **Média (P1)** | Falta uma interface visual dedicada para o afinador cromático com medição de desvio em cents e escuta colaborativa sem julgamento. | `IMPLEMENTED` *(Lógica em engine)*; `PENDING` *(UI)* | Construir o painel `ActiveListenerPanel` com consentimento explícito, indicador visual de microfone ativo e sugestões de inversão/acordes alternativos. |
| **GAP-05** | Notação de Bateria e Saxofone | **Média (P2)** | O modelo de domínio anterior restringia-se a instrumentos de cordas com trastes (`guitar`, `acoustic_guitar`, `bass`, `ukulele`). | `IMPLEMENTED` *(Domain & Engine)* | Expandir os tipos de domínio para incluir `drums` e `saxophone`, integrando mapeamento de drum grid e transposição de tonalidade (Eb/Bb). |
| **GAP-06** | Testes E2E em Navegador Real | **Média (P1)** | Os 44 testes aprovados cobrem lógica unitária e integração de API HTTP in-process, mas não testam o DOM em navegador headless real. | `NOT_IMPLEMENTED` | Configurar suíte Playwright cobrindo os fluxos de ponta a ponta: cadastro, login, conversão de áudio, reprodução de tablatura e bloqueio após o trial. |
| **GAP-07** | Gateway de Pagamento Real | **Baixa (P2)** | O checkout de planos pagos permanece bloqueado em homologação (HTTP 402) por ausência de credenciais reais do Stripe/Pix. | `BLOCKED` *(Decisão de negócio adiada)* | Manter o bloqueio seguro e transparente; o Trial Pro de 7 dias assegura acesso funcional irrestrito durante a homologação. |

---

## 3. Matriz de Priorização para a Phase C

1. **Prioridade Imediata (P0/P1)**:
   - Fornecer os novos módulos de domínio do motor musical: `intermediateRepresentation.ts`, `collectiveArrangement.ts`, `instrumentArrangement.ts`, `activeListener.ts`.
   - Garantir 100% de cobertura de testes unitários para a nova inteligência musical coletiva e adaptação instrumental.
2. **Prioridade Secundária (P1/P2)**:
   - Integrar os controles do Arrangement Map e Active Listener à interface do usuário.
   - Configurar o runner Playwright para automação de testes em navegador.
