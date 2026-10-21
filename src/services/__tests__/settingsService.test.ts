// src/services/__tests__/settingsService.test.ts
// Suíte de Testes Unitários: Ontabs Local Settings Service (Gate K.3.3.1)

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SovereignSettingsService,
  MemoryStorageAdapter,
  SettingsStorageAdapter,
  SettingsValidationError,
  CANONICAL_DEFAULTS,
  CLOUD_SYNC,
} from '../settingsService';

describe('Ontabs Local Settings Service (Gate K.3.3.1)', () => {
  let memoryStorage: MemoryStorageAdapter;
  let service: SovereignSettingsService;

  beforeEach(() => {
    memoryStorage = new MemoryStorageAdapter();
    service = new SovereignSettingsService(memoryStorage);
  });

  // 1. Defaults corretos
  it('1. Deve inicializar com os valores canônicos corretos', () => {
    const s = service.getSettings();
    expect(s.keyBindings).toEqual(['a', 's', 'd', 'f', 'g']);
    expect(s.audioVolume).toBe(0.8);
    expect(s.reducedMotion).toBe(false);
    expect(CLOUD_SYNC).toBe('DEFERRED_NOT_IMPLEMENTED');
  });

  // 2. Leitura de contexto vazio
  it('2. Deve retornar defaults para qualquer contexto novo sem dados no storage', () => {
    service.setContext({ type: 'authenticated', userId: 'user_fresh_99' });
    const s = service.getSettings();
    expect(s).toEqual(CANONICAL_DEFAULTS);
  });

  // 3. Persistência e recuperação no mesmo contexto
  it('3. Deve persistir e recuperar configurações alteradas no mesmo contexto', () => {
    service.updateSettings({ audioVolume: 0.45, reducedMotion: true });

    // Cria nova instância com o mesmo storage para simular recarga
    const reloaded = new SovereignSettingsService(memoryStorage);
    const s = reloaded.getSettings();
    expect(s.audioVolume).toBe(0.45);
    expect(s.reducedMotion).toBe(true);
    expect(s.keyBindings).toEqual(['a', 's', 'd', 'f', 'g']);
  });

  // 4. Atualização parcial preservando campos não alterados
  it('4. Deve suportar atualização parcial preservando campos omitidos', () => {
    service.updateSettings({ audioVolume: 0.25 });
    let s = service.getSettings();
    expect(s.audioVolume).toBe(0.25);
    expect(s.keyBindings).toEqual(['a', 's', 'd', 'f', 'g']);
    expect(s.reducedMotion).toBe(false);

    service.updateSettings({ reducedMotion: true });
    s = service.getSettings();
    expect(s.audioVolume).toBe(0.25);
    expect(s.reducedMotion).toBe(true);
  });

  // 5. Validação de audioVolume
  it('5. Deve validar estritamente o intervalo de audioVolume [0.0, 1.0]', () => {
    expect(() => service.updateSettings({ audioVolume: -0.1 })).toThrow(SettingsValidationError);
    expect(() => service.updateSettings({ audioVolume: 1.05 })).toThrow(SettingsValidationError);
    expect(() => service.updateSettings({ audioVolume: NaN })).toThrow(SettingsValidationError);
    expect(() => service.updateSettings({ audioVolume: Infinity })).toThrow(SettingsValidationError);
    expect(() => service.updateSettings({ audioVolume: '0.8' as any })).toThrow(SettingsValidationError);

    // O estado anterior não deve ser corrompido após erro
    expect(service.getSettings().audioVolume).toBe(0.8);

    // Valores nos limites devem ser aceitos
    expect(service.updateSettings({ audioVolume: 0.0 }).audioVolume).toBe(0.0);
    expect(service.updateSettings({ audioVolume: 1.0 }).audioVolume).toBe(1.0);
  });

  // 6. Validação de reducedMotion
  it('6. Deve aceitar apenas booleanos estritos para reducedMotion', () => {
    expect(() => service.updateSettings({ reducedMotion: 'true' as any })).toThrow(SettingsValidationError);
    expect(() => service.updateSettings({ reducedMotion: 1 as any })).toThrow(SettingsValidationError);
    expect(() => service.updateSettings({ reducedMotion: null as any })).toThrow(SettingsValidationError);

    expect(service.updateSettings({ reducedMotion: true }).reducedMotion).toBe(true);
  });

  // 7. Validação de keyBindings
  it('7. Deve validar regras de negócio para keyBindings (5 lanes, teclas únicas, 1 char)', () => {
    // Array com menos de 5 teclas
    expect(() => service.updateSettings({ keyBindings: ['a', 's', 'd', 'f'] })).toThrow(SettingsValidationError);
    // Array com mais de 5 teclas
    expect(() => service.updateSettings({ keyBindings: ['a', 's', 'd', 'f', 'g', 'h'] })).toThrow(SettingsValidationError);
    // Tecla vazia ou múltiplos caracteres
    expect(() => service.updateSettings({ keyBindings: ['a', 's', 'd', 'f', 'space'] })).toThrow(SettingsValidationError);
    expect(() => service.updateSettings({ keyBindings: ['a', 's', 'd', 'f', ''] })).toThrow(SettingsValidationError);
    // Teclas duplicadas
    expect(() => service.updateSettings({ keyBindings: ['a', 's', 'd', 'f', 'a'] })).toThrow(SettingsValidationError);

    // Array válido deve normalizar para minúsculas
    const updated = service.updateSettings({ keyBindings: ['Z', 'X', 'C', 'V', 'B'] });
    expect(updated.keyBindings).toEqual(['z', 'x', 'c', 'v', 'b']);
  });

  // 8. Recuperação de JSON inválido no storage
  it('8. Deve se recuperar graciosamente de JSON malformado no storage', () => {
    memoryStorage.setItem('ontabs:anonymous:settings:v1', 'corrupted { [ json');

    const fresh = new SovereignSettingsService(memoryStorage);
    expect(fresh.getSettings()).toEqual(CANONICAL_DEFAULTS);
  });

  // 9. Tratamento de schema desconhecido
  it('9. Deve ignorar envelopes com versão de schema desconhecida', () => {
    const invalidEnvelope = JSON.stringify({
      version: 99,
      schemaVersion: 99,
      settings: { audioVolume: 0.1, reducedMotion: true, keyBindings: ['q', 'w', 'e', 'r', 't'] },
      savedAt: new Date().toISOString(),
    });
    memoryStorage.setItem('ontabs:anonymous:settings:v1', invalidEnvelope);

    const fresh = new SovereignSettingsService(memoryStorage);
    expect(fresh.getSettings()).toEqual(CANONICAL_DEFAULTS);
  });

  // 10. Falha de leitura do armazenamento
  it('10. Deve degradar com segurança caso a leitura do storage lance exceção', () => {
    const brokenReader: SettingsStorageAdapter = {
      getItem: () => {
        throw new Error('Storage read denied (e.g. security sandbox)');
      },
      setItem: () => {},
      removeItem: () => {},
      isAvailable: () => false,
    };

    const resilientService = new SovereignSettingsService(brokenReader);
    expect(resilientService.getSettings()).toEqual(CANONICAL_DEFAULTS);
  });

  // 11. Falha de escrita do armazenamento
  it('11. Deve reter atualização em memória se a escrita no storage falhar', () => {
    const brokenWriter: SettingsStorageAdapter = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
      isAvailable: () => false,
    };

    const memoryService = new SovereignSettingsService(brokenWriter);
    const updated = memoryService.updateSettings({ audioVolume: 0.3 });
    expect(updated.audioVolume).toBe(0.3);
    expect(memoryService.getSettings().audioVolume).toBe(0.3);
  });

  // 12. Isolamento estrito entre contexto anônimo e usuário A
  it('12. Deve isolar estritamente configurações de anônimo e de usuário A', () => {
    // Anônimo altera volume para 0.2
    service.updateSettings({ audioVolume: 0.2 });
    expect(service.getSettings().audioVolume).toBe(0.2);

    // Usuário A faz login
    service.setContext({ type: 'authenticated', userId: 'user_alice_42' });
    expect(service.getSettings().audioVolume).toBe(0.8); // Defaults do Usuário A

    // Usuário A altera para 0.95
    service.updateSettings({ audioVolume: 0.95 });
    expect(service.getSettings().audioVolume).toBe(0.95);

    // Logout: volta ao contexto anônimo
    service.setContext({ type: 'anonymous' });
    expect(service.getSettings().audioVolume).toBe(0.2); // Volume do anônimo preservado
  });

  // 13. Isolamento estrito entre usuário A e usuário B
  it('13. Deve isolar completamente preferências entre Usuário A e Usuário B no mesmo host', () => {
    // Usuário Alice configura teclas específicas
    service.setContext({ type: 'authenticated', userId: 'user_alice' });
    service.updateSettings({ keyBindings: ['1', '2', '3', '4', '5'], audioVolume: 0.5 });

    // Usuário Bob faz login no mesmo dispositivo
    service.setContext({ type: 'authenticated', userId: 'user_bob' });
    expect(service.getSettings().keyBindings).toEqual(['a', 's', 'd', 'f', 'g']);
    expect(service.getSettings().audioVolume).toBe(0.8);

    // Bob configura suas teclas
    service.updateSettings({ keyBindings: ['q', 'w', 'e', 'r', 't'], audioVolume: 1.0 });

    // Alice loga novamente: suas preferências devem estar intactas
    service.setContext({ type: 'authenticated', userId: 'user_alice' });
    expect(service.getSettings().keyBindings).toEqual(['1', '2', '3', '4', '5']);
    expect(service.getSettings().audioVolume).toBe(0.5);
  });

  // 14. Troca de usuário sem vazamento de estado
  it('14. Troca de contexto deve notificar subscribers com dados do novo usuário', () => {
    const notifications: number[] = [];
    service.subscribe((s) => notifications.push(s.audioVolume));

    service.setContext({ type: 'authenticated', userId: 'user_x' });
    service.updateSettings({ audioVolume: 0.33 });

    service.setContext({ type: 'authenticated', userId: 'user_y' });
    expect(notifications).toContain(0.33);
    expect(service.getSettings().audioVolume).toBe(0.8);
  });

  // 15. Logout e retorno ao contexto anônimo
  it('15. Logout explícito restaura o contexto anônimo sem alterar dados da conta', () => {
    service.setContext({ type: 'authenticated', userId: 'user_logged' });
    service.updateSettings({ audioVolume: 0.12 });

    service.setContext({ type: 'anonymous' });
    expect(service.getContext()).toEqual({ type: 'anonymous' });
    expect(service.getSettings().audioVolume).toBe(0.8); // Default do anônimo (não alterado)
  });

  // 16. Restauração de defaults
  it('16. resetToDefaults deve restaurar os padrões canônicos para o contexto ativo', () => {
    service.updateSettings({ audioVolume: 0.1, reducedMotion: true });
    const reset = service.resetToDefaults();
    expect(reset).toEqual(CANONICAL_DEFAULTS);
    expect(service.getSettings()).toEqual(CANONICAL_DEFAULTS);
  });

  // 17. Atualização idêntica e comportamento determinístico
  it('17. Não deve disparar notificações se a atualização for idêntica ao estado ativo', () => {
    let callCount = 0;
    service.subscribe(() => {
      callCount++;
    });

    service.updateSettings({ audioVolume: 0.8 }); // Já é 0.8
    expect(callCount).toBe(0);

    service.updateSettings({ audioVolume: 0.5 }); // Mudança real
    expect(callCount).toBe(1);

    service.updateSettings({ audioVolume: 0.5 }); // Mesma coisa
    expect(callCount).toBe(1);
  });

  // 18. Falha de persistência e diagnóstico de isPersistent
  it('18. isPersistent deve refletir o estado de disponibilidade do storage', () => {
    expect(service.isPersistent()).toBe(true);

    const nonPersistentAdapter: SettingsStorageAdapter = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      isAvailable: () => false,
    };
    const degradedService = new SovereignSettingsService(nonPersistentAdapter);
    expect(degradedService.isPersistent()).toBe(false);
  });

  // 19. Imutabilidade estrita
  it('19. Não deve permitir mutação externa do estado interno por referência', () => {
    const s = service.getSettings();
    s.keyBindings[0] = 'MUTATED';
    (s as any).audioVolume = 999;

    const fresh = service.getSettings();
    expect(fresh.keyBindings[0]).toBe('a');
    expect(fresh.audioVolume).toBe(0.8);
  });

  // 20. Rejeição de identificador de usuário inválido
  it('20. Deve rejeitar ativação de contexto autenticado com userId vazio', () => {
    expect(() => service.setContext({ type: 'authenticated', userId: '' })).toThrow(SettingsValidationError);
    expect(() => service.setContext({ type: 'authenticated', userId: '   ' })).toThrow(SettingsValidationError);
    expect(service.getContext()).toEqual({ type: 'anonymous' });
  });
});
