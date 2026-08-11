# OnTabs

OnTabs transforma músicas em tablaturas para instrumentos de cordas (guitarra, violão,
baixo) e permite aprender e praticar tocando — direto no navegador, com feedback em
tempo real de acerto, combo e precisão.

## Funcionalidades atuais

- **OnTabs Play** — módulo de gameplay completo: highway de notas sincronizada com áudio
  real via Web Audio API, input por teclado/touch/Gamepad API (com detecção honesta e
  remapeamento), 4 níveis de dificuldade, modo de treino com loop e velocidade ajustável,
  alternância entre visualização de jogo/tab/acordes/ritmo, e progresso salvo por música.
- **Biblioteca** — lista de músicas e tablaturas já processadas.
- **Configurações** — teclas do Play e volume.
- **Converter** — interface e arquitetura do pipeline de conversão música→tablatura.
  A UI já reflete o fluxo real (fonte → processamento → análise musical → detecção de
  notas → tablatura → edição → Play); a detecção de notas em si ainda não está
  implementada — chamadas ao `conversionService` hoje retornam erro explícito em vez de
  fingir um resultado.

## Arquitetura

```
src/
├── components/     # componentes de shell da aplicação (navegação, etc)
├── pages/          # Home, Converter, Play, Library, Settings
├── features/
│   └── play/       # OnTabs Play — módulo autocontido (engine, input, UI, progresso)
├── services/       # camada de acesso a dados — mocks hoje, API real depois
├── stores/         # estado global (Context + useReducer)
├── types/          # modelos de domínio (Tab, Song, User)
└── styles/         # tokens visuais e estilos globais do app shell
```

O módulo `features/play` é isolado de propósito: tem seu próprio `types.ts`, engine de
jogo e engine de áudio, e não depende do resto do app. Ele consome um `GameChart`, gerado
por `chartGenerator.ts` a partir de uma `Tab` (ver `src/types/domain.ts`).

Detalhes de arquitetura interna do Play (por que o motor roda fora do ciclo de render do
React, como o timing é sincronizado, etc) estão em `src/features/play/README.md`.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run preview   # opcional, pra testar o build localmente
```

## Deploy na Vercel

O projeto usa Vite puro — a Vercel detecta automaticamente o framework. Basta importar o
repositório no dashboard da Vercel, ou:

```bash
npm i -g vercel
vercel
```

Nenhuma variável de ambiente é obrigatória na versão atual (não há backend real ainda).

## Roadmap

- [ ] Implementar `conversionService` de verdade (processamento de áudio, detecção de
      notas, geração de tablatura por instrumento).
- [ ] Integração real com upload de MP3/MP4.
- [ ] Integração com YouTube via API oficial (respeitando termos de serviço).
- [ ] Integração com Spotify via Web API (OAuth), apenas para metadados — sem download
      de áudio protegido.
- [ ] Backend real para `musicService`, `tabService` e `authService` (hoje mocks em
      memória, propositalmente identificados como tal).
- [ ] Edição de tablatura na UI (duplicar, exportar, compartilhar).

## Sobre o OnTabs Play

Documentação técnica detalhada (engines, input, integração de novas músicas) em
[`src/features/play/README.md`](./src/features/play/README.md).
