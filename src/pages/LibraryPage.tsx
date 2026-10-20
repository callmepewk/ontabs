// src/pages/LibraryPage.tsx
// Biblioteca Musical do OnTabs — Paginação Completa e Segmentação por Clique (FASE NAV)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { musicService, PaginatedSongs } from '@/services/musicService';
import { Song } from '@/types/domain';

// Acervo demonstrativo soberano para exploração pública antes do cadastro
const PUBLIC_DEMO_SONGS: Song[] = [
  {
    id: 'demo_canon',
    title: 'Canon Rock',
    artist: 'JerryC',
    durationSeconds: 312,
    bpm: 130,
    key: 'D',
    instrument: 'guitar',
    status: 'ready',
    tabId: 'demo',
  },
  {
    id: 'demo_come_together',
    title: 'Come Together',
    artist: 'The Beatles',
    durationSeconds: 259,
    bpm: 84,
    key: 'Dm',
    instrument: 'bass',
    status: 'ready',
    tabId: 'demo',
  },
  {
    id: 'demo_hotel_california',
    title: 'Hotel California',
    artist: 'Eagles',
    durationSeconds: 391,
    bpm: 75,
    key: 'Bm',
    instrument: 'acoustic_guitar',
    status: 'ready',
    tabId: 'demo',
  },
  {
    id: 'demo_billie_jean',
    title: 'Billie Jean (Groove Grid)',
    artist: 'Michael Jackson',
    durationSeconds: 294,
    bpm: 117,
    key: 'F#m',
    instrument: 'drums',
    status: 'ready',
    tabId: 'demo',
  },
  {
    id: 'demo_careless_whisper',
    title: 'Careless Whisper (Alto Sax Eb)',
    artist: 'George Michael',
    durationSeconds: 302,
    bpm: 76,
    key: 'Dm',
    instrument: 'saxophone',
    status: 'ready',
    tabId: 'demo',
  },
  {
    id: 'demo_master_puppets',
    title: 'Master of Puppets (Lead & Rhythm)',
    artist: 'Metallica',
    durationSeconds: 515,
    bpm: 212,
    key: 'Em',
    instrument: 'guitar',
    status: 'ready',
    tabId: 'demo',
  },
  {
    id: 'demo_autumn_leaves',
    title: 'Autumn Leaves (Jazz Voicings)',
    artist: 'Miles Davis & Cannonball',
    durationSeconds: 340,
    bpm: 95,
    key: 'Gm',
    instrument: 'saxophone',
    status: 'ready',
    tabId: 'demo',
  },
  {
    id: 'demo_hysteria',
    title: 'Hysteria (Distorted Bassline)',
    artist: 'Muse',
    durationSeconds: 227,
    bpm: 118,
    key: 'Am',
    instrument: 'bass',
    status: 'ready',
    tabId: 'demo',
  },
];

type SegmentType = 'all' | 'guitar' | 'bass' | 'acoustic_guitar' | 'drums' | 'saxophone' | 'recent';
type ViewMode = 'grid' | 'list';

export function LibraryPage() {
  const [data, setData] = useState<PaginatedSongs>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 6,
    totalPages: 1,
  });
  const [activeSegment, setActiveSegment] = useState<SegmentType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  async function loadSongs(page = currentPage, segment = activeSegment, query = search, limit = pageSize) {
    setLoading(true);
    try {
      const instrumentFilter =
        segment === 'all' || segment === 'recent' ? undefined : segment;

      const res = await musicService.listLibrary(page, limit, query || undefined, instrumentFilter);

      // Se a biblioteca do servidor estiver vazia (usuário não autenticado ou novo usuário),
      // disponibiliza o catálogo de demonstração pública navegável e segmentável
      if (res.total === 0 && !query) {
        setIsDemoMode(true);
        let filteredDemo = [...PUBLIC_DEMO_SONGS];
        if (instrumentFilter) {
          filteredDemo = filteredDemo.filter((s) => s.instrument === instrumentFilter);
        }
        const total = filteredDemo.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const startIndex = (page - 1) * limit;
        const items = filteredDemo.slice(startIndex, startIndex + limit);

        setData({
          items,
          total,
          page,
          pageSize: limit,
          totalPages,
        });
      } else {
        setIsDemoMode(false);
        setData(res);
      }
    } catch (err) {
      console.error('Erro ao listar músicas da biblioteca:', err);
      // Fallback seguro em caso de indisponibilidade de rede
      setIsDemoMode(true);
      setData({
        items: PUBLIC_DEMO_SONGS.slice(0, limit),
        total: PUBLIC_DEMO_SONGS.length,
        page: 1,
        pageSize: limit,
        totalPages: Math.ceil(PUBLIC_DEMO_SONGS.length / limit),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSongs(1, activeSegment, search, pageSize);
    setCurrentPage(1);
  }, [activeSegment, pageSize]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadSongs(1, activeSegment, search, pageSize);
    setCurrentPage(1);
  }

  function handleSegmentClick(segment: SegmentType) {
    setActiveSegment(segment);
    setCurrentPage(1);
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > data.totalPages) return;
    setCurrentPage(newPage);
    loadSongs(newPage, activeSegment, search, pageSize);
  }

  const segments: { id: SegmentType; label: string; icon: string }[] = [
    { id: 'all', label: 'Todas as Músicas', icon: '🎵' },
    { id: 'guitar', label: 'Guitarra Elétrica', icon: '🎸' },
    { id: 'bass', label: 'Contrabaixo', icon: '🎻' },
    { id: 'acoustic_guitar', label: 'Violão Acústico', icon: '🪕' },
    { id: 'drums', label: 'Bateria', icon: '🥁' },
    { id: 'saxophone', label: 'Saxofone', icon: '🎷' },
    { id: 'recent', label: 'Recentes', icon: '⏱️' },
  ];

  return (
    <div className="page" style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Biblioteca & Repertório</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            {data.total} {data.total === 1 ? 'música disponível' : 'músicas disponíveis'} para estudo, transcrição e gameplay.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/converter" className="btn" style={{ background: '#10b981', color: '#000', fontWeight: 600 }}>
            + Nova Análise Musical
          </Link>
        </div>
      </div>

      {/* Banner de Demonstração Pública para Visitantes */}
      {isDemoMode && (
        <div style={{
          background: 'rgba(61, 220, 151, 0.08)',
          border: '1px solid rgba(61, 220, 151, 0.25)',
          borderRadius: 8,
          padding: '10px 16px',
          marginTop: 16,
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div>
            <span style={{ color: '#10b981', fontWeight: 700 }}>👁️ Modo Demonstração Pública:</span>{' '}
            Você está explorando o catálogo de referência do OnTabs. Navegue livremente por instrumentos, tablaturas e paginação antes de se cadastrar.
          </div>
          <Link to="/register" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'underline' }}>
            Criar conta para salvar seu próprio acervo →
          </Link>
        </div>
      )}

      {/* Segmentação por Clique (Botões de Categoria de Instrumento) */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        padding: '14px 0 4px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 16,
      }}>
        {segments.map((seg) => {
          const isActive = activeSegment === seg.id;
          return (
            <button
              key={seg.id}
              onClick={() => handleSegmentClick(seg.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: isActive ? '1px solid #10b981' : '1px solid var(--border)',
                background: isActive ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-elevated)',
                color: isActive ? '#10b981' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{seg.icon}</span>
              <span>{seg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Barra de Ferramentas: Pesquisa, Seletor de Modo de Exibição e Tamanho de Página */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
      }}>
        {/* Formulário de Busca */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, artista ou tonalidade..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: '#09090b',
              color: 'var(--text)',
              fontSize: 13,
            }}
          />
          <button type="submit" className="btn secondary" style={{ fontSize: 13 }}>
            Buscar
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Seletor de Itens por Página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Exibir:</span>
            {[6, 12, 24].map((size) => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  border: pageSize === size ? '1px solid #10b981' : '1px solid var(--border)',
                  background: pageSize === size ? '#10b981' : 'transparent',
                  color: pageSize === size ? '#000' : 'var(--text-muted)',
                  fontWeight: pageSize === size ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Toggle de Modo Grade / Lista */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'grid' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: viewMode === 'grid' ? '#10b981' : 'var(--text-muted)',
                fontWeight: viewMode === 'grid' ? 700 : 400,
              }}
              title="Visualização em Grade"
            >
              ▦ Grade
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'list' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: viewMode === 'list' ? '#10b981' : 'var(--text-muted)',
                fontWeight: viewMode === 'list' ? 700 : 400,
              }}
              title="Visualização em Lista"
            >
              ☰ Lista
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo: Lista ou Grade */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando repertório...
        </div>
      ) : data.items.length === 0 ? (
        <div className="empty-state card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 16 }}>Nenhuma música encontrada para os critérios selecionados.</p>
          <button
            className="btn"
            onClick={() => {
              setActiveSegment('all');
              setSearch('');
            }}
            style={{ marginTop: 12 }}
          >
            Limpar Filtros de Pesquisa
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Visualização em Grade (Cards) */
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {data.items.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 16,
                background: '#0e0f17',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    color: '#3ddc97',
                    fontWeight: 600,
                  }}>
                    {s.instrument || 'guitar'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {s.bpm ? `${s.bpm} BPM` : ''} {s.key ? `· Tom: ${s.key}` : ''}
                  </span>
                </div>
                <h3 style={{ margin: '10px 0 4px', fontSize: 15 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{s.artist}</p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Link
                  to={`/tab/${s.tabId || s.id}`}
                  className="btn secondary"
                  style={{ flex: 1, textAlign: 'center', fontSize: 12, padding: '6px 8px' }}
                >
                  Ver Tab & Arranjo
                </Link>
                <Link
                  to={`/play/${s.id}`}
                  className="btn"
                  style={{ flex: 1, textAlign: 'center', fontSize: 12, background: '#10b981', color: '#000', padding: '6px 8px', fontWeight: 600 }}
                >
                  🎮 Praticar
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Visualização em Lista Detalhada (Tabela) */
        <div className="card" style={{ padding: 0, overflowX: 'auto', background: '#0e0f17' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Título & Artista</th>
                <th style={{ padding: '12px 16px' }}>Instrumento</th>
                <th style={{ padding: '12px 16px' }}>BPM</th>
                <th style={{ padding: '12px 16px' }}>Tonalidade</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.artist}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: 4, textTransform: 'capitalize' }}>
                      {s.instrument || 'Guitarra'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {s.bpm || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>
                    {s.key || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <Link
                        to={`/tab/${s.tabId || s.id}`}
                        className="btn secondary"
                        style={{ fontSize: 11, padding: '4px 8px' }}
                      >
                        Tablatura
                      </Link>
                      <Link
                        to={`/play/${s.id}`}
                        className="btn"
                        style={{ fontSize: 11, padding: '4px 8px', background: '#10b981', color: '#000', fontWeight: 600 }}
                      >
                        Praticar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Controles de Paginação Acessíveis e Determinísticos */}
      {data.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 28,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Exibindo {Math.min(data.total, (currentPage - 1) * pageSize + 1)}–
            {Math.min(data.total, currentPage * pageSize)} de {data.total} músicas
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Primeira Página */}
            <button
              className="btn secondary"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(1)}
              style={{ padding: '4px 8px', fontSize: 12 }}
              title="Primeira página"
            >
              «
            </button>

            {/* Página Anterior */}
            <button
              className="btn secondary"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              ← Anterior
            </button>

            {/* Números das Páginas */}
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                  border: currentPage === p ? '1px solid #10b981' : '1px solid var(--border)',
                  background: currentPage === p ? '#10b981' : 'transparent',
                  color: currentPage === p ? '#000' : 'var(--text-muted)',
                  fontWeight: currentPage === p ? 700 : 400,
                }}
              >
                {p}
              </button>
            ))}

            {/* Próxima Página */}
            <button
              className="btn secondary"
              disabled={currentPage >= data.totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              Próxima →
            </button>

            {/* Última Página */}
            <button
              className="btn secondary"
              disabled={currentPage >= data.totalPages}
              onClick={() => handlePageChange(data.totalPages)}
              style={{ padding: '4px 8px', fontSize: 12 }}
              title="Última página"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
