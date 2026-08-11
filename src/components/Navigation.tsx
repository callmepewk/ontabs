// src/components/Navigation.tsx
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/converter', label: 'Converter', icon: '🎛️' },
  { to: '/play', label: 'OnTabs Play', icon: '🎮' },
  { to: '/library', label: 'Biblioteca', icon: '📚' },
  { to: '/settings', label: 'Configurações', icon: '⚙️' },
];

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="app-logo">ONTABS</div>
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
