import { describe, it, expect } from 'vitest';
import * as UI from '../index';

describe('UI Primitives Module Integrity', () => {
  it('exports all expected primitive components', () => {
    expect(UI.Button).toBeDefined();
    expect(UI.Card).toBeDefined();
    expect(UI.Input).toBeDefined();
    expect(UI.Skeleton).toBeDefined();
  });

  it('verifies displayName contracts', () => {
    expect(UI.Button.displayName).toBe('Button');
    expect(UI.Card.displayName).toBe('Card');
    expect(UI.Input.displayName).toBe('Input');
  });
});
