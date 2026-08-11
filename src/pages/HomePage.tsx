// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';

const FEATURES = [
  { to: '/converter', title: 'Converter', desc: 'Transforme uma música em tablatura (em construção).', icon: '🎛️' },
  { to: '/play', title: 'OnTabs Play', desc: 'Toque tablaturas reais num highway de notas sincronizado.', icon: '🎮' },
  { to: '/library', title: 'Biblioteca', desc: 'Suas músicas e tablaturas processadas.', icon: '📚' },
];

export function HomePage() {
  return (
    <div className="page">
      <h1 className="page-title">OnTabs</h1>
      <p className="page-subtitle">Transforme músicas em tablaturas para instrumentos de cordas — e aprenda jogando.</p>

      <div className="card-grid">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className="card" style={{ display: 'block' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <strong>{f.title}</strong>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
