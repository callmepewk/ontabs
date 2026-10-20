// src/components/Navigation.tsx
// Componente de Navegação Principal do Ontabs

import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { authService, EntitlementInfo } from '@/services/authService';
import { User } from '@/types/domain';

const LINKS = [
  { to: '/', label: 'Início', icon: '🏠', end: true },
  { to: '/converter', label: 'Converter', icon: '🎛️' },
  { to: '/play', label: 'OnTabs Play', icon: '🎮' },
  { to: '/library', label: 'Biblioteca', icon: '📚' },
  { to: '/setlists', label: 'Repertórios', icon: '📋' },
  { to: '/planos', label: 'Planos', icon: '💎' },
  { to: '/settings', label: 'Configurações', icon: '⚙️' },
];

export function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementInfo | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setUser).catch(() => null);
    authService.getEntitlementStatus().then(setEntitlement).catch(() => null);
  }, []);

  return (
    <aside className="app-sidebar" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="app-logo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>ON</span><span style={{ color: '#10b981' }}>TABS</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Status da Conta e Trial */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', marginTop: 20 }}>
        {user ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{user.email}</div>
            {entitlement?.accessState === 'TRIAL_ACTIVE' && (
              <span style={{ fontSize: 10, background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 6px', borderRadius: 4 }}>
                Trial Pro: {entitlement.remainingTrialHours}h restantes
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Link to="/login" className="btn secondary" style={{ fontSize: 12, padding: '4px 8px', textAlign: 'center' }}>
              Entrar
            </Link>
            <Link to="/register" className="btn" style={{ fontSize: 12, padding: '4px 8px', textAlign: 'center', background: '#10b981', color: '#000', fontWeight: 600 }}>
              Criar Conta Grátis
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="app-mobile-nav">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          style={{ flexDirection: 'column', fontSize: 10, gap: 2 }}
        >
          <span style={{ fontSize: 18 }}>{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
