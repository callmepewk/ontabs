// src/pages/LibraryPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { musicService } from '@/services/musicService';
import { Song } from '@/types/domain';

export function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    musicService.listLibrary().then(setSongs);
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Biblioteca</h1>
      <p className="page-subtitle">Músicas e tablaturas processadas.</p>

      {songs.length === 0 ? (
        <div className="empty-state card">
          <p>Sua biblioteca está vazia.</p>
          <Link to="/converter" className="btn" style={{ display: 'inline-block', marginTop: 16 }}>
            Converter uma música
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {songs.map((s) => (
            <div key={s.id} className="card">
              <strong>{s.title}</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.artist} · {s.status}</p>
              {s.status === 'ready' && (
                <Link to={`/play/${s.id}`} className="btn secondary" style={{ marginTop: 10, display: 'inline-block' }}>
                  Jogar
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
