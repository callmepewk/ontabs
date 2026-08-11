// ontabs-play/hooks/useGameEngine.ts
import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../audioEngine';
import { GamepadManager } from '../gamepadManager';
import { InputManager } from '../inputManager';
import { GameEngine } from '../gameEngine';
import { GameChart, GameStats, KeyBindings } from '../types';

interface UseGameEngineArgs {
  chart: GameChart;
  audioUrl: string;
  bindings: KeyBindings;
}

export function useGameEngine({ chart, audioUrl, bindings }: UseGameEngineArgs) {
  const audioRef = useRef<AudioEngine | null>(null);
  const gamepadRef = useRef<GamepadManager | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const audio = new AudioEngine();
      await audio.load(audioUrl);
      if (cancelled) return;

      const gamepad = new GamepadManager();
      const input = new InputManager(bindings, gamepad);
      const engine = new GameEngine(chart, audio, {
        onStatsChange: (s) => setStats(s),
        onGameEnd: (s) => { setStats(s); setEnded(true); },
      });

      input.onLaneHit((lane) => engine.hitLane(lane));
      input.attach();

      // gamepad precisa ser "poll"ado dentro do loop de frame do próprio engine
      const originalStart = engine.start.bind(engine);
      engine.start = () => {
        originalStart();
        const pollLoop = () => {
          if (!engineRef.current) return;
          gamepad.poll();
          requestAnimationFrame(pollLoop);
        };
        requestAnimationFrame(pollLoop);
      };

      audioRef.current = audio;
      gamepadRef.current = gamepad;
      inputRef.current = input;
      engineRef.current = engine;
      setReady(true);
    }

    setup();
    return () => {
      cancelled = true;
      inputRef.current?.detach();
      engineRef.current?.stop();
      audioRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, audioUrl]);

  useEffect(() => {
    inputRef.current?.updateBindings(bindings);
  }, [bindings]);

  function playFromStart() {
    audioRef.current?.play(0);
    engineRef.current?.start();
    setEnded(false);
  }

  return {
    ready,
    stats,
    ended,
    engine: engineRef.current,
    audio: audioRef.current,
    gamepadManager: gamepadRef.current,
    input: inputRef.current,
    playFromStart,
  };
}
