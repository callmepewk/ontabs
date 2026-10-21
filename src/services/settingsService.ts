// src/services/settingsService.ts
// Ontabs Local Settings Service (Gate K.3.3.1)
// Camada isolada, tipada, imutável e resiliente para preferências de usuário.
// Sincronização remota: DEFERRED_NOT_IMPLEMENTED

import { UserSettings } from '@/types/domain';

export const CLOUD_SYNC = 'DEFERRED_NOT_IMPLEMENTED' as const;

export const CANONICAL_DEFAULTS: Readonly<UserSettings> = Object.freeze({
  keyBindings: Object.freeze(['a', 's', 'd', 'f', 'g']) as unknown as string[],
  audioVolume: 0.8,
  reducedMotion: false,
});

export const CURRENT_SCHEMA_VERSION = 1;

export type SettingsContext =
  | { type: 'anonymous' }
  | { type: 'authenticated'; userId: string };

export interface SettingsEnvelope {
  version: number;
  schemaVersion: number;
  settings: UserSettings;
  savedAt: string;
}

export interface SettingsStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  isAvailable(): boolean;
}

export class SettingsValidationError extends Error {
  constructor(message: string, public readonly field?: keyof UserSettings) {
    super(message);
    this.name = 'SettingsValidationError';
  }
}

/**
 * Adaptador em memória para execução sem navegador, modo anônimo estrito ou testes unitários.
 */
export class MemoryStorageAdapter implements SettingsStorageAdapter {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  isAvailable(): boolean {
    return true;
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Adaptador seguro para o localStorage do navegador com fallback automático em memória.
 */
export class LocalStorageAdapter implements SettingsStorageAdapter {
  private memoryFallback = new MemoryStorageAdapter();
  private persistent = true;

  constructor() {
    this.checkPersistence();
  }

  private checkPersistence(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        this.persistent = false;
        return;
      }
      const testKey = '__ontabs_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      this.persistent = true;
    } catch {
      this.persistent = false;
    }
  }

  getItem(key: string): string | null {
    if (!this.persistent) {
      return this.memoryFallback.getItem(key);
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return this.memoryFallback.getItem(key);
    }
  }

  setItem(key: string, value: string): void {
    if (!this.persistent) {
      this.memoryFallback.setItem(key, value);
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Se quota exceder ou storage for bloqueado, degrada silenciosamente para memória
      this.persistent = false;
      this.memoryFallback.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    if (!this.persistent) {
      this.memoryFallback.removeItem(key);
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      this.memoryFallback.removeItem(key);
    }
  }

  isAvailable(): boolean {
    return this.persistent;
  }
}

export interface SettingsService {
  getContext(): SettingsContext;
  setContext(context: SettingsContext): void;
  getSettings(): UserSettings;
  updateSettings(patch: Partial<UserSettings>): UserSettings;
  resetToDefaults(): UserSettings;
  subscribe(listener: (settings: UserSettings) => void): () => void;
  isPersistent(): boolean;
}

/**
 * Implementação Soberana do Serviço Local de Configurações
 */
export class SovereignSettingsService implements SettingsService {
  private currentContext: SettingsContext = { type: 'anonymous' };
  private activeSettings: UserSettings;
  private listeners = new Set<(settings: UserSettings) => void>();
  private storage: SettingsStorageAdapter;

  constructor(storageAdapter?: SettingsStorageAdapter) {
    this.storage = storageAdapter || new LocalStorageAdapter();
    this.activeSettings = this.loadFromStorage();
  }

  /**
   * Retorna uma cópia profunda dos padrões canônicos.
   */
  public getDefaultSettings(): UserSettings {
    return {
      keyBindings: [...CANONICAL_DEFAULTS.keyBindings],
      audioVolume: CANONICAL_DEFAULTS.audioVolume,
      reducedMotion: CANONICAL_DEFAULTS.reducedMotion,
    };
  }

  /**
   * Computa a chave de armazenamento para o contexto atual.
   * Não expõe tokens, e-mails ou credenciais.
   */
  private getStorageKey(context: SettingsContext): string {
    if (context.type === 'anonymous') {
      return `ontabs:anonymous:settings:v${CURRENT_SCHEMA_VERSION}`;
    }
    // Higieniza o identificador de usuário para uso seguro em chave de namespace
    const safeUserId = encodeURIComponent(context.userId.trim());
    return `ontabs:user:${safeUserId}:settings:v${CURRENT_SCHEMA_VERSION}`;
  }

  /**
   * Validação estrita e determinística de cada campo das configurações.
   * Lança SettingsValidationError se qualquer campo for inválido.
   */
  public validateSettings(candidate: unknown): asserts candidate is UserSettings {
    if (!candidate || typeof candidate !== 'object') {
      throw new SettingsValidationError('Configurações devem ser um objeto válido.');
    }

    const s = candidate as Record<string, unknown>;

    // 1. Validação de audioVolume
    if (typeof s.audioVolume !== 'number' || !Number.isFinite(s.audioVolume)) {
      throw new SettingsValidationError('audioVolume deve ser um número finito.', 'audioVolume');
    }
    if (s.audioVolume < 0.0 || s.audioVolume > 1.0) {
      throw new SettingsValidationError(
        `audioVolume deve estar no intervalo [0.0, 1.0]. Recebido: ${s.audioVolume}`,
        'audioVolume'
      );
    }

    // 2. Validação de reducedMotion
    if (typeof s.reducedMotion !== 'boolean') {
      throw new SettingsValidationError(
        'reducedMotion deve ser um booleano estrito (true/false).',
        'reducedMotion'
      );
    }

    // 3. Validação de keyBindings
    if (!Array.isArray(s.keyBindings)) {
      throw new SettingsValidationError('keyBindings deve ser uma lista (array).', 'keyBindings');
    }
    if (s.keyBindings.length !== 5) {
      throw new SettingsValidationError(
        `keyBindings deve conter exatamente 5 pistas (lanes). Recebido: ${s.keyBindings.length}`,
        'keyBindings'
      );
    }

    const seenKeys = new Set<string>();
    for (let i = 0; i < s.keyBindings.length; i++) {
      const key = s.keyBindings[i];
      if (typeof key !== 'string' || key.length === 0) {
        throw new SettingsValidationError(
          `Tecla na pista ${i + 1} deve ser uma string não vazia.`,
          'keyBindings'
        );
      }
      const normalizedKey = key.trim().toLowerCase();
      if (normalizedKey.length !== 1) {
        throw new SettingsValidationError(
          `Tecla na pista ${i + 1} deve ser um único caractere. Recebido: "${key}"`,
          'keyBindings'
        );
      }
      if (seenKeys.has(normalizedKey)) {
        throw new SettingsValidationError(
          `Teclas duplicadas em keyBindings não são permitidas. Tecla repetida: "${normalizedKey}"`,
          'keyBindings'
        );
      }
      seenKeys.add(normalizedKey);
    }
  }

  /**
   * Carrega do storage para o contexto ativo com recuperação segura de dados.
   */
  private loadFromStorage(): UserSettings {
    const key = this.getStorageKey(this.currentContext);
    try {
      const raw = this.storage.getItem(key);
      if (!raw) {
        return this.getDefaultSettings();
      }

      const parsed = JSON.parse(raw);

      // Verificação de envelope
      if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return this.getDefaultSettings();
      }

      const settingsCandidate = parsed.settings;
      this.validateSettings(settingsCandidate);

      return {
        keyBindings: [...settingsCandidate.keyBindings.map((k: string) => k.toLowerCase())],
        audioVolume: Number(settingsCandidate.audioVolume),
        reducedMotion: Boolean(settingsCandidate.reducedMotion),
      };
    } catch {
      // Se o JSON estiver corrompido ou o schema inválido, retorna os defaults seguros em memória
      return this.getDefaultSettings();
    }
  }

  /**
   * Persiste as configurações ativas com envelope versionado.
   */
  private saveToStorage(settings: UserSettings): boolean {
    const key = this.getStorageKey(this.currentContext);
    const envelope: SettingsEnvelope = {
      version: CURRENT_SCHEMA_VERSION,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: {
        keyBindings: [...settings.keyBindings],
        audioVolume: settings.audioVolume,
        reducedMotion: settings.reducedMotion,
      },
      savedAt: new Date().toISOString(),
    };

    try {
      this.storage.setItem(key, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retorna o contexto de identidade ativo.
   */
  public getContext(): SettingsContext {
    return { ...this.currentContext };
  }

  /**
   * Altera o contexto de identidade (anônimo ou usuário autenticado).
   * Desacoplado do sistema de autenticação: recebe identidade explícita e isola namespaces.
   */
  public setContext(context: SettingsContext): void {
    if (context.type === 'authenticated' && (!context.userId || typeof context.userId !== 'string' || !context.userId.trim())) {
      throw new SettingsValidationError('Identificador de usuário inválido para contexto autenticado.');
    }

    // Se o contexto for exatamente o mesmo, não recarrega desnecessariamente
    if (
      this.currentContext.type === context.type &&
      (context.type === 'anonymous' || (this.currentContext as any).userId === context.userId)
    ) {
      return;
    }

    this.currentContext = context.type === 'anonymous'
      ? { type: 'anonymous' }
      : { type: 'authenticated', userId: context.userId.trim() };

    // Carrega o estado específico deste contexto
    this.activeSettings = this.loadFromStorage();
    this.notifyListeners();
  }

  /**
   * Obtém uma cópia imutável das configurações ativas.
   */
  public getSettings(): UserSettings {
    return {
      keyBindings: [...this.activeSettings.keyBindings],
      audioVolume: this.activeSettings.audioVolume,
      reducedMotion: this.activeSettings.reducedMotion,
    };
  }

  /**
   * Aplica atualização parcial imutável com validação atômica antes da persistência.
   */
  public updateSettings(patch: Partial<UserSettings>): UserSettings {
    if (!patch || typeof patch !== 'object') {
      throw new SettingsValidationError('O patch de atualização deve ser um objeto.');
    }

    // Monta candidato mesclado imutável
    const candidate: UserSettings = {
      keyBindings: patch.keyBindings
        ? [...patch.keyBindings.map((k) => (typeof k === 'string' ? k.toLowerCase() : k))]
        : [...this.activeSettings.keyBindings],
      audioVolume: patch.audioVolume !== undefined ? patch.audioVolume : this.activeSettings.audioVolume,
      reducedMotion: patch.reducedMotion !== undefined ? patch.reducedMotion : this.activeSettings.reducedMotion,
    };

    // Validação estrita: rejeita integralmente se qualquer campo for inválido
    this.validateSettings(candidate);

    // Verifica se houve mudança real (evita notificações espúrias)
    const isIdentical =
      candidate.audioVolume === this.activeSettings.audioVolume &&
      candidate.reducedMotion === this.activeSettings.reducedMotion &&
      candidate.keyBindings.length === this.activeSettings.keyBindings.length &&
      candidate.keyBindings.every((k, i) => k === this.activeSettings.keyBindings[i]);

    if (isIdentical) {
      return this.getSettings();
    }

    // Comita o estado em memória e no storage
    this.activeSettings = candidate;
    this.saveToStorage(candidate);
    this.notifyListeners();

    return this.getSettings();
  }

  /**
   * Restaura o contexto ativo para os padrões canônicos.
   */
  public resetToDefaults(): UserSettings {
    const defaults = this.getDefaultSettings();
    this.activeSettings = defaults;
    this.saveToStorage(defaults);
    this.notifyListeners();
    return this.getSettings();
  }

  /**
   * Subscrição reativa para consumidores (SettingsPage, HUD, etc.)
   */
  public subscribe(listener: (settings: UserSettings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const current = this.getSettings();
    for (const listener of this.listeners) {
      try {
        listener(current);
      } catch (err) {
        // Impede que erro em um listener interrompa a execução dos demais
        console.error('Erro em subscriber do settingsService:', err);
      }
    }
  }

  /**
   * Retorna true se o armazenamento persistente está disponível e ativo.
   */
  public isPersistent(): boolean {
    return this.storage.isAvailable();
  }
}

// Singleton padrão soberano para consumo no frontend
export const settingsService: SettingsService = new SovereignSettingsService();
