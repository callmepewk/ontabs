// ontabs-play/inputManager.ts
// Unifica teclado, touch e gamepad em um único evento: onLaneHit(lane).
// O GameEngine não sabe (nem precisa saber) de onde veio o input.

import { GamepadManager } from './gamepadManager';
import { KeyBindings } from './types';

type LaneHitHandler = (lane: number, source: 'keyboard' | 'touch' | 'gamepad') => void;
type StrumHandler = () => void;

export class InputManager {
  private bindings: KeyBindings;
  private gamepad: GamepadManager;
  private laneHandlers = new Set<LaneHitHandler>();
  private strumHandlers = new Set<StrumHandler>();
  private keydownListener?: (e: KeyboardEvent) => void;
  private unsubGamepadDown?: () => void;

  constructor(bindings: KeyBindings, gamepad: GamepadManager) {
    this.bindings = bindings;
    this.gamepad = gamepad;
  }

  updateBindings(bindings: KeyBindings) {
    this.bindings = bindings;
  }

  attach(): void {
    this.keydownListener = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const lane = this.bindings.keyboard.findIndex((k) => k.toLowerCase() === key);
      if (lane >= 0) {
        e.preventDefault();
        this.emitLane(lane, 'keyboard');
      }
    };
    window.addEventListener('keydown', this.keydownListener);

    this.unsubGamepadDown = this.gamepad.onButtonDown(({ buttonIndex }) => {
      const laneBtns = this.bindings.gamepadButtons ?? [];
      const lane = laneBtns.indexOf(buttonIndex);
      if (lane >= 0) {
        this.emitLane(lane, 'gamepad');
        return;
      }
      if (this.bindings.gamepadStrumButtons?.includes(buttonIndex)) {
        this.strumHandlers.forEach((cb) => cb());
      }
    });
  }

  detach(): void {
    if (this.keydownListener) window.removeEventListener('keydown', this.keydownListener);
    this.unsubGamepadDown?.();
  }

  /** Chamado pelos botões touch grandes na tela mobile. */
  touchHit(lane: number): void {
    this.emitLane(lane, 'touch');
  }

  private emitLane(lane: number, source: 'keyboard' | 'touch' | 'gamepad') {
    this.laneHandlers.forEach((cb) => cb(lane, source));
  }

  onLaneHit(cb: LaneHitHandler) { this.laneHandlers.add(cb); return () => this.laneHandlers.delete(cb); }
  onStrum(cb: StrumHandler) { this.strumHandlers.add(cb); return () => this.strumHandlers.delete(cb); }
}
