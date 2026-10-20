// src/pages/SettingsPage.tsx
// OnTabs Configurações e Preferências de Usuário (Gate K.3.3.2)
// Integração local com settingsService, suporte a anônimos/autenticados e acessibilidade.
// Cloud sync: DEFERRED_NOT_IMPLEMENTED

import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import {
  settingsService,
  SettingsValidationError,
} from '@/services/settingsService';
import { User, UserSettings } from '@/types/domain';
import { Button, Card } from '@/components/ui';

export function SettingsPage() {
  // Inicialização síncrona com os defaults do settingsService (zero tela branca para anônimos)
  const [settings, setSettings] = useState<UserSettings>(() => settingsService.getSettings());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Se houver token gravado, está resolvendo sessão com backend; se não houver token, já é anônimo síncrono
  const [isAuthResolving, setIsAuthResolving] = useState<boolean>(() => {
    try {
      return Boolean(authService.getToken());
    } catch {
      return false;
    }
  });

  const [isPersistent, setIsPersistent] = useState<boolean>(() => settingsService.isPersistent());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Buffer local para edição de teclas (5 pistas)
  const [keyBuffer, setKeyBuffer] = useState<string[]>(() => [...settings.keyBindings]);

  useEffect(() => {
    let isMounted = true;

    // Subscrição reativa para atualizações do settingsService
    const unsubscribe = settingsService.subscribe((newSettings) => {
      if (isMounted) {
        setSettings(newSettings);
        setKeyBuffer([...newSettings.keyBindings]);
      }
    });

    // Resolução de contexto de identidade via authService existente
    async function resolveSession() {
      try {
        const token = authService.getToken();
        if (!token) {
          if (isMounted) {
            settingsService.setContext({ type: 'anonymous' });
            setCurrentUser(null);
            setIsAuthResolving(false);
          }
          return;
        }

        const user = await authService.getCurrentUser();
        if (!isMounted) return;

        if (user && user.id) {
          settingsService.setContext({ type: 'authenticated', userId: user.id });
          setCurrentUser(user);
        } else {
          settingsService.setContext({ type: 'anonymous' });
          setCurrentUser(null);
        }
      } catch {
        if (!isMounted) return;
        // Se a chamada de rede da sessão falhar, degrada com segurança para anônimo
        settingsService.setContext({ type: 'anonymous' });
        setCurrentUser(null);
      } finally {
        if (isMounted) {
          setIsAuthResolving(false);
          const active = settingsService.getSettings();
          setSettings(active);
          setKeyBuffer([...active.keyBindings]);
          setIsPersistent(settingsService.isPersistent());
        }
      }
    }

    resolveSession();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  function notifySuccess(text: string) {
    setErrorMessage(null);
    setSuccessMessage(text);
    setTimeout(() => {
      setSuccessMessage((prev) => (prev === text ? null : prev));
    }, 3000);
  }

  function handleVolumeChange(newVolume: number) {
    try {
      setErrorMessage(null);
      settingsService.updateSettings({ audioVolume: newVolume });
      notifySuccess(`Volume ajustado para ${Math.round(newVolume * 100)}%`);
    } catch (err) {
      const msg = err instanceof SettingsValidationError ? err.message : 'Falha ao atualizar volume.';
      setErrorMessage(msg);
    }
  }

  function handleReducedMotionToggle() {
    try {
      setErrorMessage(null);
      const nextValue = !settings.reducedMotion;
      settingsService.updateSettings({ reducedMotion: nextValue });
      notifySuccess(
        nextValue ? 'Redução de movimento ativada.' : 'Redução de movimento desativada.'
      );
    } catch (err) {
      const msg = err instanceof SettingsValidationError ? err.message : 'Falha ao atualizar acessibilidade.';
      setErrorMessage(msg);
    }
  }

  function handleKeyChange(index: number, rawValue: string) {
    const char = rawValue.trim().toLowerCase().slice(-1); // Pega apenas o último caractere digitado
    const nextKeys = [...keyBuffer];
    nextKeys[index] = char;
    setKeyBuffer(nextKeys);

    if (!char) {
      setErrorMessage(`A pista ${index + 1} precisa de uma tecla definida.`);
      return;
    }

    try {
      setErrorMessage(null);
      settingsService.updateSettings({ keyBindings: nextKeys });
      notifySuccess('Controles de teclado atualizados.');
    } catch (err) {
      if (err instanceof SettingsValidationError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Tecla inválida ou duplicada.');
      }
    }
  }

  function handleResetDefaults() {
    try {
      setErrorMessage(null);
      const defaults = settingsService.resetToDefaults();
      setSettings(defaults);
      setKeyBuffer([...defaults.keyBindings]);
      notifySuccess('Configurações restauradas para os padrões canônicos.');
    } catch (err) {
      setErrorMessage('Falha ao restaurar configurações padrão.');
    }
  }

  return (
    <div className="page" style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 80 }}>
      {/* Cabeçalho Principal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Configurações
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                background: currentUser ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                color: currentUser ? 'var(--accent-electric)' : 'var(--accent-neon)',
                border: `1px solid ${currentUser ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isAuthResolving
                ? 'Identificando Sessão...'
                : currentUser
                ? `Conta: ${currentUser.name || currentUser.email}`
                : 'Modo Anônimo (Navegador)'}
            </span>
          </div>
          <p className="page-subtitle" style={{ margin: '6px 0 0 0' }}>
            Preferências locais de reprodução, acessibilidade e controles do OnTabs Play.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetDefaults}
          aria-label="Restaurar configurações para padrões canônicos"
        >
          Restaurar Padrões
        </Button>
      </div>

      {/* Alerta de Feedback de Sucesso */}
      {successMessage && (
        <div
          role="status"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--accent-neon)',
            color: 'var(--accent-neon)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Alerta de Erro de Validação */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-coral)',
            color: 'var(--accent-coral)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            aria-label="Fechar mensagem de erro"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-coral)',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Aviso de Armazenamento em Memória (se indisponível) */}
      {!isPersistent && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid var(--accent-amber)',
            color: 'var(--accent-amber)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>ℹ️</span>
          <span>
            Armazenamento permanente bloqueado ou em modo anônimo estrito. Suas alterações permanecem ativas na memória durante esta sessão.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Seção 1: Áudio & Volume */}
        <Card elevation={1}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, margin: 0, color: 'var(--text-primary)' }}>
                Áudio & Reprodução
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Volume do sintetizador Web Audio e reprodução de stems de áudio real.
              </p>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--accent-neon)',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              {Math.round(settings.audioVolume * 100)}%
            </span>
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              htmlFor="audio-volume-slider"
              style={{ display: 'none' }}
            >
              Volume de áudio
            </label>
            <input
              id="audio-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.audioVolume}
              aria-label="Volume de áudio principal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(settings.audioVolume * 100)}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--accent-neon)',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 6,
              }}
            >
              <span>Mudo (0%)</span>
              <span>Padrão (80%)</span>
              <span>Máximo (100%)</span>
            </div>
          </div>
        </Card>

        {/* Seção 2: Controles do OnTabs Play */}
        <Card elevation={1}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, margin: 0, color: 'var(--text-primary)' }}>
              Controles do OnTabs Play
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Mapeamento de teclas para as 5 pistas (lanes) na highway rítmica.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
              marginTop: 12,
            }}
          >
            {keyBuffer.map((key, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'var(--surface-base)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 8px',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Pista {i + 1}
                </span>
                <input
                  id={`key-binding-lane-${i + 1}`}
                  aria-label={`Tecla da pista ${i + 1}`}
                  value={key}
                  maxLength={1}
                  onChange={(e) => handleKeyChange(i, e.target.value)}
                  style={{
                    width: 44,
                    height: 44,
                    textAlign: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--surface-overlay)',
                    color: 'var(--accent-electric)',
                    outline: 'none',
                    textTransform: 'uppercase',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color var(--duration-fast) var(--ease-spring)',
                  }}
                />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '14px 0 0 0' }}>
            💡 Dica: Digite uma tecla única para cada pista. Teclas duplicadas serão recusadas para evitar sobreposição no jogo.
          </p>
        </Card>

        {/* Seção 3: Acessibilidade & Movimento */}
        <Card elevation={1}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 16, margin: 0, color: 'var(--text-primary)' }}>
                Acessibilidade
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Reduz transições dinâmicas e efeitos visuais acelerados.
              </p>
            </div>
            <Button
              variant={settings.reducedMotion ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleReducedMotionToggle}
              aria-label={settings.reducedMotion ? 'Desativar redução de movimento' : 'Ativar redução de movimento'}
              aria-pressed={settings.reducedMotion}
            >
              {settings.reducedMotion ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
