// src/components/Navigation.tsx
// Componente de Navegação Principal do Ontabs (Desktop Sidebar + Mobile Bar)

import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { authService, EntitlementInfo } from '@/services/authService';
import { User } from '@/types/domain';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconConverter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconLibrary = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const IconSetlists = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IconPlans = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LINKS: NavItem[] = [
  { to: '/', label: 'Início', icon: <IconHome />, end: true },
  { to: '/converter', label: 'Converter', icon: <IconConverter /> },
  { to: '/play', label: 'OnTabs Play', icon: <IconPlay /> },
  { to: '/library', label: 'Biblioteca', icon: <IconLibrary /> },
  { to: '/setlists', label: 'Repertórios', icon: <IconSetlists /> },
  { to: '/planos', label: 'Planos', icon: <IconPlans /> },
  { to: '/settings', label: 'Configurações', icon: <IconSettings /> },
];

export function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    authService.getCurrentUser()
      .then((u) => { if (isMounted) setUser(u); })
      .catch(() => null);
    authService.getEntitlementStatus()
      .then((e) => { if (isMounted) setEntitlement(e); })
      .catch(() => null);

    return () => { isMounted = false; };
  }, []);

  return (
    <aside className="app-sidebar" aria-label="Navegação Principal">
      <div>
        {/* Logo da Aplicação — Limpo, Intencional, sem Badges Falsos */}
        <Link to="/" className="app-logo" style={{ textDecoration: 'none' }}>
          <span style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}>ON</span>
          <span style={{ color: 'var(--accent-primary)', letterSpacing: '0.04em' }}>TABS</span>
        </Link>

        {/* Links de Navegação com Ícones Vetoriais Sutis */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }} aria-label="Menu Principal">
          {LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', opacity: 0.85 }} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Cartão de Identidade / Sessão do Usuário */}
      <div
        style={{
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border-subtle)',
          marginTop: '20px',
        }}
      >
        {user ? (
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '8px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.email}
            </div>

            {entitlement?.accessState === 'TRIAL_ACTIVE' && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--accent-primary)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Trial: {entitlement.remainingTrialHours}h restantes</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link
              to="/login"
              className="btn secondary"
              style={{
                fontSize: '12px',
                padding: '7px 12px',
                width: '100%',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="btn"
              style={{
                fontSize: '12px',
                padding: '7px 12px',
                width: '100%',
                borderRadius: 'var(--radius-md)',
              }}
            >
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
    <nav className="app-mobile-nav" aria-label="Navegação Móvel">
      {LINKS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          style={{
            flexDirection: 'column',
            fontSize: '10px',
            gap: '3px',
            padding: '6px 8px',
            minWidth: '44px',
            minHeight: '44px',
            justifyContent: 'center',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', opacity: 0.85 }} aria-hidden="true">
            {item.icon}
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
