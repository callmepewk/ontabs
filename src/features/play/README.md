# OnTabs Play

Módulo de gameplay musical do OnTabs — highway de notas sincronizada com áudio real,
input por teclado/touch/gamepad, treino de trecho, modos de aprendizado e progresso salvo.

## Onde isso entra no seu repo

Copie a pasta inteira `ontabs-play/` para dentro do seu projeto, por exemplo:

```
src/features/play/        (Next.js / CRA / Vite)
```

Depois crie a rota `/play/:songId` apontando pro `PlayScreen`:

```tsx
import { PlayScreen } from '@/features/play/PlayScreen';
import { generateGameChart } from '@/features/play/chartGenerator';

// pseudo-exemplo — troque pela sua busca real de música/tab
const tabEvents = await getTabEventsForSong(songId); // seu parser de tab existente
const chart = generateGameChart(tabEvents, {
  songId, title, artist, bpm, laneCount: 5, difficulty: 'medium', durationSeconds,
});

<PlayScreen chart={chart} audioUrl={song.audioUrl} onExit={() => router.back()} />
```

## Pontos de integração que você provavelmente vai querer trocar

| Arquivo | O que fazer |
|---|---|
| `chartGenerator.ts` | Trocar o mapeamento `stringToLane` pela lógica real de cordas/casas da sua tablatura. Hoje ele assume `TabEvent[]` genérico — plugue no parser que já gera as tabs do OnTabs. |
| `progressStore.ts` | `LocalStorageAdapter` é o padrão. Se o OnTabs já tem conta de usuário/backend, implemente `ProgressAdapter` apontando pra sua API (mesma interface, troca só a implementação). |
| `components/LearnModeTabs` + trecho `learnMode !== 'game'` em `PlayScreen.tsx` | Hoje é um placeholder. Aqui é onde você deve renderizar seus componentes existentes de visualização de tab/acordes/ritmo, sem pausar o áudio. |
| `gamepadManager.ts` → `DEFAULT_KEY_BINDINGS` | Mapeamento inicial de botão de guitarra Guitar Hero/Rock Band via USB. Varia por fabricante — por isso a tela `/play` sempre expõe remapeamento antes de começar. |

## Arquitetura (por que está organizado assim)

- **`audioEngine.ts`** é a única fonte de verdade de tempo. Nada no jogo usa `Date.now()` ou
  `setInterval` pra saber "que hora da música é essa" — tudo lê `audio.getCurrentTime()`,
  que vem do relógio do próprio `AudioContext`. Isso é o que mantém áudio e notas sincronizados
  mesmo com variação de framerate.
- **`gameEngine.ts`** roda em `requestAnimationFrame` e desenha direto em `<canvas>`,
  fora do ciclo de render do React. O React só recebe atualizações via `onStatsChange`/`onHit`,
  que disparam bem menos que 60x/segundo. Isso resolve o requisito de não usar React state
  por frame de animação.
- **`inputManager.ts`** unifica teclado, touch e gamepad num único evento (`hitLane`), então o
  `GameEngine` não precisa saber a origem do input.
- **`gamepadManager.ts`** só reporta o que `navigator.getGamepads()` de fato expõe. Se o
  dispositivo não aparecer ali, a UI mostra o aviso de incompatibilidade — nunca finge suporte.

## O que ainda é stub / depende do seu backend

- Áudio: o engine espera uma URL de arquivo de áudio real (`audioUrl`) — não gera nada sintético.
- Tab → Chart: `chartGenerator.ts` espera `TabEvent[]` no formato genérico descrito em `types.ts`.
  Ele não sabe nada sobre o formato interno de tabs que o OnTabs já usa — é só trocar a função
  que popula esse array pela sua já existente.
- Persistência: por padrão usa `localStorage`. Troque por API real quando fizer sentido.

## Rodando o mini demo isolado

Se você quiser testar a experiência sem plugar no resto do OnTabs ainda, veja o artifact
interativo enviado junto (`ontabs-play-demo`) — ele roda no navegador com um chart e áudio
sintéticos gerados na hora, só pra validar a sensação de jogabilidade (timing, combo, gamepad).
