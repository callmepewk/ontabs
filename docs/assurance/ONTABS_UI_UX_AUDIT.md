# OnTabs — Auditoria de UI/UX, Design System & Acessibilidade (Phase 0/1)
**Identificador**: ONTABS-SPEC-UI-001  
**Classificação**: Design de Interação, Acessibilidade, Motion Design e Auditoria Visual  
**Data**: 2026-10-19  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Princípios de Design & Reconciliação Visual

A referência estética canônica do OnTabs é a sofisticação escura, focada no músico, observada na versão de homologação (`https://ontabs.base44.app`). 

O objetivo da auditoria e do trabalho de design é eliminar qualquer aspecto genérico ou improvisado, estabelecendo uma identidade premium, funcional e musical.

### 1.1 Diretrizes de Motion & Feedback
1. **Motion com Propósito**: Animações suaves de transição de abas e expansão de controles (150ms a 250ms com curva `cubic-bezier(0.16, 1, 0.3, 1)`).
2. **Respeito a `prefers-reduced-motion`**: Todos os efeitos de transição são desativados quando o usuário solicita redução de movimento no sistema operacional.
3. **Indicadores de Atividade Honestos**: Barras de progresso e spinners refletem o trabalho real do pipeline; se uma etapa não expõe porcentagem contínua, exibe-se estado de pulso sutil (*determinate vs. indeterminate*).

---

## 2. Inventário de Telas e Avaliação de Maturidade

| Rota / Página | Arquivo | Propósito Principal | Diagnóstico de UX Atual | Ações de Hardening Realizadas / Planejadas |
|---|---|---|---|---|
| `/` (Início) | `HomePage.tsx` | Apresentação rápida e portal de entrada para conversão e prática | Visual escuro funcional, com CTA claro para conversor e biblioteca. | Manter coerência com a identidade premium e tipografia sóbria. |
| `/converter` | `ConverterPage.tsx` | Upload de arquivo, resolução de links e geração de tablaturas | Exibe seletor de instrumentos, upload local com validação, banner de trial e card de conectores externos. | **Hardened**: Adicionada validação de links YouTube/Spotify, mensagens claras de capabilities e proteção contra falsos sucessos. |
| `/tab/:id` | `TabViewerPage.tsx` | Visualização da tablatura, seções da música e player integrado | Exibe dados da música, afinação, bpm, seções e tabela de notas com player básico. | Evoluir para suportar o *Arrangement Map* e seletor de partes (Guitarra 1/2, Baixo, Violão). |
| `/library` | `LibraryPage.tsx` | Exploração do catálogo de músicas salvas do usuário e de estúdio | Paginação server-side real (10 itens/página), busca por texto e filtro de instrumentos. | Totalmente integrada com controle de autorização e exclusão de itens próprios. |
| `/planos` | `PlansPage.tsx` | Apresentação dos planos Free, Pro e Premium e status de trial | Grid de planos com cards informativos e cálculo de horas restantes do trial Pro. | **Hardened**: Bloqueia simulação arbitrária de planos pagos; exibe aviso explícito de homologação com código 402. |
| `/login` e `/register` | `LoginPage.tsx` / `RegisterPage.tsx` | Autenticação e entrada de novos usuários | Formulários diretos com validação de campos e ativação do trial de 7 dias. | Mensagens de erro de credenciais e integridade de senhas testadas. |
| `/play` | `PlayPage.tsx` | Módulo de jogo rítmico (OnTabs Play) com highway e treinamento | Highway em canvas 2D com suporte a teclado e gamepad. | Integrar diretamente com as tablaturas salvas na biblioteca. |

---

## 3. Tokens do Sistema de Design (CSS Variables)

Os tokens definidos em [`src/styles/global.css`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/styles/global.css) garantem consistência visual em toda a aplicação:

- **Cores de Fundo**:
  - Base: `#000000`
  - Superfície Elevada (`--bg-elevated`): `#121214`
  - Borda Neutra (`--border`): `#27272a`
- **Cores de Destaque**:
  - Destaque Principal (`--accent`): `#10b981` (Verde Esmeralda Musical — alta legibilidade sobre preto)
  - Alerta / Aviso: `#f59e0b` (Âmbar)
  - Erro Crítico: `#ef4444` (Vermelho Carmim)
  - Informação / Conector: `#3b82f6` (Azul Safira)
- **Tipografia**:
  - Família: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif`
  - Escala: `12px` (microcopy/tags), `13px` (subtítulos e ajuda), `14px` (corpo padrão), `18px` (títulos de card), `24px` a `32px` (títulos de página).

---

## 4. Conformidade de Acessibilidade (WCAG 2.1 AA)

1. **Relação de Contraste**: Todos os textos principais mantêm contraste superior a `7:1` sobre o fundo escuro; textos secundários mantêm contraste superior a `4.5:1`.
2. **Navegação por Teclado**: Todos os elementos interativos (`button`, `input`, `a`) possuem foco visível (`focus-visible`) com anel de contorno esmeralda.
3. **Leitores de Tela**: Formulários e botões possuem atributos `aria-label` ou texto descritivo intrínseco.
