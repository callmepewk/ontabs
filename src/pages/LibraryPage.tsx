// src/pages/LibraryPage.tsx
// Biblioteca de Músicas e Tablaturas do Ontabs com Paginação Soberana

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { musicService, PaginatedSongs } from '@/services/musicService';

export function LibraryPage() {
  const [data, setData] = useState<PaginatedSongs>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 6,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [instrument, setInstrument] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchSongs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await musicService.listLibrary(page, 6, search || undefined, instrument || undefined);
      setData(res);
    } catch (err) {
      console.error('Erro ao listar músicas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs(1);
  }, [instrument]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSongs(1);
  };

  return (
    <div className="page" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Biblioteca Musical</h1>
          <p className="page-subtitle">
            {data.total} {data.total === 1 ? 'música catalogada' : 'músicas catalogadas'} disponíveis para estudo e gameplay.
          </p>
        </div>
        <Link to="/converter" className="btn" style={{ background: '#10b981', color: '#000', fontWeight: 600 }}>
          + Importar ou Converter Música
        </Link>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div style={{ display: 'flex', gap: 12, margin: '20px 0', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou artista..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text)',
            }}
          />
          <button type="submit" className="btn secondary">Buscar</button>
        </form>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'Todos', val: '' },
            { label: 'Guitarra', val: 'guitar' },
            { label: 'Baixo', val: 'bass' },
            { label: 'Violão', val: 'acoustic_guitar' },
            { label: 'Ukulele', val: 'ukulele' },
          ].map((inst) => (
            <button
              key={inst.val}
              onClick={() => setInstrument(inst.val)}
              className="btn"
              style={{
                fontSize: 12,
                padding: '6px 12px',
                background: instrument === inst.val ? '#10b981' : 'var(--bg-elevated)',
                color: instrument === inst.val ? '#000' : 'var(--text)',
              }}
            >
              {inst.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo / Cards */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando catálogo...</div>
      ) : data.items.length === 0 ? (
        <div className="empty-state card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 16 }}>Nenhuma música encontrada com os filtros selecionados.</p>
          <Link to="/converter" className="btn" style={{ marginTop: 12 }}>
            Converter sua primeira música
          </Link>
        </div>
      ) : (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {data.items.map((s: any) => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                    {s.instrument || 'guitar'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.bpm ? `${s.bpm} BPM` : ''}</span>
                </div>
                <h3 style={{ margin: '12px 0 4px', fontSize: 16 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{s.artist}</p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {s.tabId && (
                  <Link to={`/tab/${s.tabId}`} className="btn secondary" style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
                    Ver Tab
                  </Link>
                )}
                <Link to={`/play/${s.id}`} className="btn" style={{ flex: 1, textAlign: 'center', fontSize: 12, background: '#10b981', color: '#000' }}>
                  Jogar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 32 }}>
          <button
            className="btn secondary"
            disabled={data.page <= 1}
            onClick={() => fetchSongs(data.page - 1)}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Página {data.page} de {data.totalPages}
          </span>
          <button
            className="btn secondary"
            disabled={data.page >= data.totalPages}
            onClick={() => fetchSongs(data.page + 1)}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
