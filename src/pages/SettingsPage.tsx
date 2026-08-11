// src/pages/SettingsPage.tsx
import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { UserSettings } from '@/types/domain';

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then((u) => setSettings(u?.settings ?? null));
  }, []);

  if (!settings) return null;

  async function update(patch: Partial<UserSettings>) {
    const user = await authService.updateSettings(patch);
    setSettings(user.settings);
  }

  return (
    <div className="page">
      <h1 className="page-title">Configurações</h1>
      <p className="page-subtitle">Preferências do usuário e do sistema.</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <strong>Teclas do OnTabs Play</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {settings.keyBindings.map((key, i) => (
            <input
              key={i}
              value={key}
              maxLength={1}
              onChange={(e) => {
                const next = [...settings.keyBindings];
                next[i] = e.target.value.toLowerCase();
                update({ keyBindings: next });
              }}
              style={{ width: 40, textAlign: 'center', padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}
            />
          ))}
        </div>
      </div>

      <div className="card">
        <strong>Volume</strong>
        <input
          type="range" min={0} max={1} step={0.05}
          value={settings.audioVolume}
          onChange={(e) => update({ audioVolume: Number(e.target.value) })}
          style={{ width: '100%', marginTop: 10 }}
        />
      </div>
    </div>
  );
}
