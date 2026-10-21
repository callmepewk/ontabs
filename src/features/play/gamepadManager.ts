// ontabs-play/gamepadManager.ts
// Nunca assume mapeamento universal. Só reporta o que o navegador de fato expôs
// via Gamepad API. Se o dispositivo não aparecer em navigator.getGamepads(),
// o app deve mostrar o aviso de incompatibilidade — nunca fingir suporte.

import { GamepadInfo, KeyBindings } from './types';

const GUITAR_ID_HINTS = ['guitar', 'hero', 'rock band', 'harmonix', 'fret'];

export type GamepadButtonEdge = { gamepadIndex: number; buttonIndex: number };

export class GamepadManager {
  private connected = new Map<number, Gamepad>();
  private prevButtonStates = new Map<number, boolean[]>();
  private listeners = {
    connect: new Set<(info: GamepadInfo) => void>(),
    disconnect: new Set<(index: number) => void>(),
    buttonDown: new Set<(edge: GamepadButtonEdge) => void>(),
    buttonUp: new Set<(edge: GamepadButtonEdge) => void>(),
  };

  constructor() {
    window.addEventListener('gamepadconnected', (e) => this.handleConnect(e as GamepadEvent));
    window.addEventListener('gamepaddisconnected', (e) => this.handleDisconnect(e as GamepadEvent));
  }

  private handleConnect(e: GamepadEvent) {
    this.connected.set(e.gamepad.index, e.gamepad);
    this.prevButtonStates.set(e.gamepad.index, e.gamepad.buttons.map((b) => b.pressed));
    this.listeners.connect.forEach((cb) => cb(this.toInfo(e.gamepad)));
  }

  private handleDisconnect(e: GamepadEvent) {
    this.connected.delete(e.gamepad.index);
    this.prevButtonStates.delete(e.gamepad.index);
    this.listeners.disconnect.forEach((cb) => cb(e.gamepad.index));
  }

  private toInfo(pad: Gamepad): GamepadInfo {
    const id = pad.id.toLowerCase();
    return {
      index: pad.index,
      id: pad.id,
      connected: pad.connected,
      isLikelyGuitar: GUITAR_ID_HINTS.some((hint) => id.includes(hint)),
      buttons: pad.buttons.length,
      axes: pad.axes.length,
    };
  }

  /** Chamar a cada frame (dentro do loop do GameEngine) para detectar edges de botão. */
  poll(): void {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      this.connected.set(pad.index, pad);
      const prev = this.prevButtonStates.get(pad.index) ?? pad.buttons.map(() => false);
      pad.buttons.forEach((btn, i) => {
        const wasPressed = prev[i] ?? false;
        if (btn.pressed && !wasPressed) {
          this.listeners.buttonDown.forEach((cb) => cb({ gamepadIndex: pad.index, buttonIndex: i }));
        } else if (!btn.pressed && wasPressed) {
          this.listeners.buttonUp.forEach((cb) => cb({ gamepadIndex: pad.index, buttonIndex: i }));
        }
      });
      this.prevButtonStates.set(pad.index, pad.buttons.map((b) => b.pressed));
    }
  }

  getConnectedGamepads(): GamepadInfo[] {
    return Array.from(this.connected.values()).map((p) => this.toInfo(p));
  }

  isAnyGamepadConnected(): boolean {
    return this.connected.size > 0;
  }

  onConnect(cb: (info: GamepadInfo) => void) { this.listeners.connect.add(cb); return () => { this.listeners.connect.delete(cb); }; }
  onDisconnect(cb: (index: number) => void) { this.listeners.disconnect.add(cb); return () => { this.listeners.disconnect.delete(cb); }; }
  onButtonDown(cb: (edge: GamepadButtonEdge) => void) { this.listeners.buttonDown.add(cb); return () => { this.listeners.buttonDown.delete(cb); }; }
  onButtonUp(cb: (edge: GamepadButtonEdge) => void) { this.listeners.buttonUp.add(cb); return () => { this.listeners.buttonUp.delete(cb); }; }
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  keyboard: ['a', 's', 'd', 'f', 'g'],
  // Padrão comum em guitarras de Guitar Hero USB/Xbox expostas como Gamepad:
  // 0=Verde 1=Vermelho 2=Azul 3=Amarelo 4=Laranja (varia por fabricante — por isso o remapeamento é obrigatório)
  gamepadButtons: [0, 1, 2, 3, 4],
  gamepadStrumButtons: [12, 13], // d-pad up/down, comum em guitarras Rock Band/GH
  gamepadOverdriveButton: 8,
};
