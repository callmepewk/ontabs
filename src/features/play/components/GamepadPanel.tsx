// ontabs-play/components/GamepadPanel.tsx
// Mostra o que o navegador REALMENTE expôs via Gamepad API.
// Nunca finge compatibilidade com um controlador não reconhecido.

import { useEffect, useState } from 'react';
import { GamepadManager } from '../gamepadManager';
import { GamepadInfo, KeyBindings } from '../types';

interface GamepadPanelProps {
  gamepadManager: GamepadManager;
  bindings: KeyBindings;
  onRemap: (bindings: KeyBindings) => void;
}

const LANE_LABELS = ['Verde', 'Vermelho', 'Amarelo', 'Azul', 'Laranja', 'Extra'];

export function GamepadPanel({ gamepadManager, bindings, onRemap }: GamepadPanelProps) {
  const [pads, setPads] = useState<GamepadInfo[]>(gamepadManager.getConnectedGamepads());
  const [remapLane, setRemapLane] = useState<number | null>(null);

  useEffect(() => {
    const offConnect = gamepadManager.onConnect(() => setPads(gamepadManager.getConnectedGamepads()));
    const offDisconnect = gamepadManager.onDisconnect(() => setPads(gamepadManager.getConnectedGamepads()));
    return () => { offConnect(); offDisconnect(); };
  }, [gamepadManager]);

  useEffect(() => {
    if (remapLane === null) return;
    const off = gamepadManager.onButtonDown(({ buttonIndex }) => {
      const next = [...(bindings.gamepadButtons ?? [])];
      next[remapLane] = buttonIndex;
      onRemap({ ...bindings, gamepadButtons: next });
      setRemapLane(null);
    });
    return off;
  }, [remapLane, gamepadManager, bindings, onRemap]);

  if (pads.length === 0) {
    return (
      <div className="otp-gamepad-panel otp-gamepad-empty">
        <p>
          Nenhum controlador detectado. Se você tem uma guitarra ou controle, conecte-o e
          pressione qualquer botão nele antes de abrir o modo Play.
        </p>
        <p className="otp-gamepad-hint">
          Seu navegador não disponibilizou este controlador como Gamepad. Tente conectar
          antes de abrir o modo Play.
        </p>
      </div>
    );
  }

  return (
    <div className="otp-gamepad-panel">
      {pads.map((pad) => (
        <div key={pad.index} className="otp-gamepad-card">
          <div className="otp-gamepad-status">
            <span className="otp-dot-online" />
            Controle conectado
          </div>
          <div className="otp-gamepad-name">{pad.id}</div>
          <div className="otp-gamepad-meta">
            {pad.isLikelyGuitar ? 'Guitarra detectada' : 'Gamepad genérico'} · {pad.buttons} botões · {pad.axes} eixos
          </div>
        </div>
      ))}

      <div className="otp-remap">
        <h4>Remapeamento</h4>
        {(bindings.gamepadButtons ?? []).map((btn, lane) => (
          <button
            key={lane}
            className={`otp-remap-row ${remapLane === lane ? 'active' : ''}`}
            onClick={() => setRemapLane(lane)}
          >
            <span>{LANE_LABELS[lane] ?? `Lane ${lane}`}</span>
            <span>{remapLane === lane ? 'Pressione um botão...' : `Botão ${btn}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
