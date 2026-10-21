// src/pages/__tests__/SettingsPage.test.tsx
// Testes de Integração e Renderização: SettingsPage (Gate K.3.3.2)

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsPage } from '../SettingsPage';
import {
  settingsService,
  CANONICAL_DEFAULTS,
  CLOUD_SYNC,
} from '@/services/settingsService';

describe('SettingsPage Local Integration (Gate K.3.3.2)', () => {
  beforeEach(() => {
    settingsService.setContext({ type: 'anonymous' });
    settingsService.resetToDefaults();
  });

  // 1. Eliminação da tela branca para anônimos
  it('1. Deve renderizar HTML completo para visitante anônimo (zero retorno de null)', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    // Não pode ser vazio (o bug anterior retornava string vazia / null)
    expect(html).not.toBe('');
    expect(html.length).toBeGreaterThan(500);

    // Deve conter os títulos principais
    expect(html).toContain('Configurações');
    expect(html).toContain('Modo Anônimo (Navegador)');
    expect(html).toContain('Áudio &amp; Reprodução');
    expect(html).toContain('Controles do OnTabs Play');
    expect(html).toContain('Acessibilidade');
  });

  // 2. Apresentação dos defaults canônicos
  it('2. Deve apresentar os defaults canônicos nos controles de interface', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    // Volume padrão 80%
    expect(html).toContain('80%');
    expect(html).toContain('value="0.8"');

    // As 5 teclas padrão: A, S, D, F, G
    expect(html).toContain('Pista 1');
    expect(html).toContain('Pista 2');
    expect(html).toContain('Pista 3');
    expect(html).toContain('Pista 4');
    expect(html).toContain('Pista 5');
    expect(html).toContain('value="a"');
    expect(html).toContain('value="s"');
    expect(html).toContain('value="d"');
    expect(html).toContain('value="f"');
    expect(html).toContain('value="g"');

    // Redução de movimento desativada por padrão
    expect(html).toContain('Desativado');
  });

  // 3. Atualização de estado refletida na interface
  it('3. Deve refletir alterações do settingsService imediatamente na renderização', () => {
    // Altera volume e ativa movimento reduzido no serviço
    settingsService.updateSettings({
      audioVolume: 0.5,
      reducedMotion: true,
      keyBindings: ['z', 'x', 'c', 'v', 'b'],
    });

    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('50%');
    expect(html).toContain('value="0.5"');
    expect(html).toContain('Ativado');
    expect(html).toContain('value="z"');
    expect(html).toContain('value="x"');
    expect(html).toContain('value="c"');
    expect(html).toContain('value="v"');
    expect(html).toContain('value="b"');
  });

  // 4. Integração com contexto de usuário autenticado
  it('4. Deve alternar contexto para usuário autenticado mantendo renderização íntegra', () => {
    settingsService.setContext({ type: 'authenticated', userId: 'user_guitarist_77' });
    settingsService.updateSettings({ audioVolume: 0.95 });

    const html = renderToStaticMarkup(<SettingsPage />);
    expect(html).toContain('95%');
    expect(html).toContain('value="0.95"');
  });

  // 5. Acessibilidade e atributos ARIA
  it('5. Deve incluir labels acessíveis e semântica de formulário nos controles', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('aria-label="Volume de áudio principal"');
    expect(html).toContain('aria-label="Tecla da pista 1"');
    expect(html).toContain('aria-label="Tecla da pista 5"');
    expect(html).toContain('aria-label="Restaurar configurações para padrões canônicos"');
  });

  // 6. Confirmação de que sincronização em nuvem não foi implementada
  it('6. Deve confirmar formalmente que CLOUD_SYNC está diferido', () => {
    expect(CLOUD_SYNC).toBe('DEFERRED_NOT_IMPLEMENTED');
  });

  // 7. Restauração de padrões
  it('7. Deve restaurar defaults canônicos após resetToDefaults', () => {
    settingsService.updateSettings({ audioVolume: 0.2, reducedMotion: true });
    expect(settingsService.getSettings().audioVolume).toBe(0.2);

    settingsService.resetToDefaults();
    expect(settingsService.getSettings()).toEqual(CANONICAL_DEFAULTS);

    const html = renderToStaticMarkup(<SettingsPage />);
    expect(html).toContain('80%');
    expect(html).toContain('Desativado');
  });
});
