// src/pages/LibraryPage.tsx
// Biblioteca Musical do OnTabs — Modernização Visual, Paginação e Catálogo Soberano

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  musicService,
  PaginatedSongs,
  VerifiedAsset,
  CatalogResponse,
} from '@/services/musicService';
import { Song } from '@/types/domain';
import { Button, Card, Input, Skeleton } from '@/components/ui';

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

function getRightsBadge(asset: VerifiedAsset) {
  if (asset.isPublicDomain) {
    return {
      text: '✓ DOMÍNIO PÚBLICO',
      bg: 'rgba(16, 185, 129, 0.15)',
      color: 'var(--accent-neon)',
      border: 'rgba(16, 185, 129, 0.35)',
    };
  }
  if (asset.licenseId === 'CC-BY-4.0') {
    return {
      text: 'CC BY 4.0 · CRÉDITO OBRIGATÓRIO',
      bg: 'rgba(59, 130, 246, 0.15)',
      color: 'var(--accent-electric)',
      border: 'rgba(59, 130, 246, 0.35)',
    };
  }
  if (asset.licenseId?.includes('NC') || asset.licenseId?.includes('NON-COMMERCIAL')) {
    return {
      text: 'CC BY-NC-SA · NÃO COMERCIAL',
      bg: 'rgba(168, 85, 247, 0.15)',
      color: '#c084fc',
      border: 'rgba(168, 85, 247, 0.35)',
    };
  }
  return {
    text: 'RESTRITO · METADATA ONLY / DRM',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: 'var(--accent-amber)',
    border: 'rgba(245, 158, 11, 0.35)',
  };
}

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'catalog'>('library');
  const [catalogData, setCatalogData] = useState<CatalogResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'public_demo' | 'internal_validation' | 'restricted_or_pending'>('all');

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

  async function loadCatalog() {
    setCatalogLoading(true);
    try {
      const res = await musicService.listCatalog();
      setCatalogData(res);
    } catch (err) {
      console.error('Erro ao carregar catálogo verificado:', err);
    } finally {
      setCatalogLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'catalog' && !catalogData) {
      loadCatalog();
    }
  }, [activeTab]);

  async function loadSongs(page = currentPage, segment = activeSegment, query = search, limit = pageSize) {
    setLoading(true);
    try {
      const instrumentFilter =
        segment === 'all' || segment === 'recent' ? undefined : segment;

      const res = await musicService.listLibrary(page, limit, query || undefined, instrumentFilter);

      // Se a biblioteca pessoal estiver vazia (novo usuário ou visitante),
      // disponibiliza o catálogo de demonstração pública navegável
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
    <div className="page" style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 80 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Biblioteca & Repertório</h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0 0' }}>
            {data.total} {data.total === 1 ? 'música disponível' : 'músicas disponíveis'} para estudo, transcrição e gameplay.
          </p>
        </div>
        <div>
          <Link to="/converter">
            <Button variant="primary">
              + Nova Análise Musical
            </Button>
          </Link>
        </div>
      </div>

      {/* Abas Principais de Seção */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 20,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 2,
        }}
      >
        <button
          onClick={() => setActiveTab('library')}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: activeTab === 'library' ? 600 : 500,
            color: activeTab === 'library' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'library' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all var(--duration-fast) var(--ease-spring)',
          }}
        >
          <span>Meu Repertório & Análises</span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'library' ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-overlay)',
              color: activeTab === 'library' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            {data.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: activeTab === 'catalog' ? 600 : 500,
            color: activeTab === 'catalog' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'catalog' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all var(--duration-fast) var(--ease-spring)',
          }}
        >
          <span>Catálogo Soberano Verificado (Direitos & Proveniência)</span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'catalog' ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-overlay)',
              color: activeTab === 'catalog' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            9 Obras
          </span>
        </button>
      </div>

      {activeTab === 'library' ? (
        <>
          {/* Banner de Demonstração Pública para Visitantes */}
          {isDemoMode && (
            <Card
              elevation={1}
              style={{
                marginTop: 20,
                background: 'rgba(16, 185, 129, 0.05)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '14px 18px',
              }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Modo Demonstração Pública:</span>{' '}
                Você está explorando o catálogo de referência do OnTabs. Navegue livremente por instrumentos, tablaturas e paginação antes de se cadastrar.
              </div>
              <Link to="/register">
                <Button variant="secondary" size="sm">
                  Criar conta para salvar seu acervo →
                </Button>
              </Link>
            </Card>
          )}

          {/* Segmentação por Clique (Botões de Categoria de Instrumento) */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '16px 0 8px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 20,
            }}
          >
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
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: isActive ? 'var(--accent-subtle)' : 'var(--surface-base)',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all var(--duration-fast) var(--ease-spring)',
                  }}
                >
                  <span>{seg.icon}</span>
                  <span>{seg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Barra de Ferramentas: Pesquisa, Seletor de Modo de Exibição e Tamanho de Página */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 24,
            }}
          >
            {/* Formulário de Busca */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
              <div style={{ flex: 1 }}>
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título, artista ou tonalidade..."
                  style={{ padding: '8px 14px', fontSize: 13 }}
                />
              </div>
              <Button type="submit" variant="secondary" size="md">
                Buscar
              </Button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Seletor de Itens por Página */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>Exibir:</span>
                {[6, 12, 24].map((size) => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      border: pageSize === size ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: pageSize === size ? 'var(--accent-primary)' : 'var(--surface-base)',
                      color: pageSize === size ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: pageSize === size ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Toggle de Modo Grade / Lista */}
              <div
                style={{
                  display: 'flex',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'var(--surface-base)',
                }}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    border: 'none',
                    background: viewMode === 'grid' ? 'var(--surface-overlay)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: viewMode === 'grid' ? 600 : 500,
                  }}
                  title="Visualização em Grade"
                >
                  ▦ Grade
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    border: 'none',
                    background: viewMode === 'list' ? 'var(--surface-overlay)' : 'transparent',
                    color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: viewMode === 'list' ? 600 : 500,
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
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {Array.from({ length: pageSize }).map((_, idx) => (
                <Card key={idx} elevation={1} style={{ padding: 20 }}>
                  <Skeleton width="40%" height="18px" style={{ marginBottom: 14 }} />
                  <Skeleton width="80%" height="22px" style={{ marginBottom: 8 }} />
                  <Skeleton width="55%" height="16px" style={{ marginBottom: 20 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Skeleton width="50%" height="34px" radius="var(--radius-pill)" />
                    <Skeleton width="50%" height="34px" radius="var(--radius-pill)" />
                  </div>
                </Card>
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <Card elevation={1} style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                Nenhuma música encontrada para os critérios selecionados.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveSegment('all');
                  setSearch('');
                }}
              >
                Limpar Filtros de Pesquisa
              </Button>
            </Card>
          ) : viewMode === 'grid' ? (
            /* Visualização em Grade (Cards) */
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {data.items.map((s) => (
                <Card
                  key={s.id}
                  elevation={1}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 20,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 11,
                          background: 'var(--surface-overlay)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {s.instrument || 'guitar'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {s.bpm ? `${s.bpm} BPM` : ''} {s.key ? `· Tom: ${s.key}` : ''}
                      </span>
                    </div>
                    <h3 style={{ margin: '14px 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {s.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{s.artist}</p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <Link to={`/tab/${s.tabId || s.id}`} style={{ flex: 1 }}>
                      <Button variant="secondary" size="sm" style={{ width: '100%', fontSize: 12 }}>
                        Ver Tablatura
                      </Button>
                    </Link>
                    <Link to={`/play/${s.id}`} style={{ flex: 1 }}>
                      <Button variant="primary" size="sm" style={{ width: '100%', fontSize: 12 }}>
                        Praticar
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Visualização em Lista Detalhada (Tabela) */
            <Card elevation={1} style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: 'var(--surface-elevated)',
                    }}
                  >
                    <th style={{ padding: '14px 18px' }}>Título & Artista</th>
                    <th style={{ padding: '14px 18px' }}>Instrumento</th>
                    <th style={{ padding: '14px 18px' }}>BPM</th>
                    <th style={{ padding: '14px 18px' }}>Tonalidade</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((s) => (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background var(--duration-fast) var(--ease-spring)',
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.artist}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            background: 'var(--surface-overlay)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {s.instrument || 'Guitarra'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {s.bpm || '—'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {s.key || '—'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <Link to={`/tab/${s.tabId || s.id}`}>
                            <Button variant="secondary" size="sm" style={{ fontSize: 12, padding: '4px 10px' }}>
                              Tablatura
                            </Button>
                          </Link>
                          <Link to={`/play/${s.id}`}>
                            <Button variant="primary" size="sm" style={{ fontSize: 12, padding: '4px 10px' }}>
                              Praticar
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Controles de Paginação Acessíveis e Determinísticos */}
          {data.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 32,
                paddingTop: 18,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Exibindo {Math.min(data.total, (currentPage - 1) * pageSize + 1)}–
                {Math.min(data.total, currentPage * pageSize)} de {data.total} músicas
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Primeira Página */}
                <button
                  className="btn secondary"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(1)}
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  title="Primeira página"
                >
                  «
                </button>

                {/* Página Anterior */}
                <button
                  className="btn secondary"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  ← Anterior
                </button>

                {/* Números das Páginas */}
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      cursor: 'pointer',
                      border: currentPage === p ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: currentPage === p ? 'var(--accent-primary)' : 'var(--surface-base)',
                      color: currentPage === p ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: currentPage === p ? 600 : 500,
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
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  Próxima →
                </button>

                {/* Última Página */}
                <button
                  className="btn secondary"
                  disabled={currentPage >= data.totalPages}
                  onClick={() => handlePageChange(data.totalPages)}
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  title="Última página"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Seção do Catálogo Verificado */
        <div style={{ marginTop: 24 }}>
          {/* Header Explicativo de Direitos e Soberania */}
          <Card
            elevation={1}
            style={{
              background: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)',
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>
                Catálogo Auditado & Inteligência de Direitos Autorais
              </strong>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              Todas as 9 obras abaixo foram catalogadas com <strong>separação tripartite de direitos</strong> (Composição, Arranjo e Fonograma) segundo a Lei 9.610/98 e convenções internacionais. Apenas obras de domínio público integral e licenças Creative Commons estritas com atribuição são liberadas para processamento e execução. Áudios protegidos por DRM (ex: Spotify) são restritos a <em>METADATA_ONLY</em> sem extração de áudio.
            </p>
          </Card>

          {/* Filtros de Coleção do Catálogo */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 12,
              marginBottom: 20,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {[
              { id: 'all', label: 'Todas as Obras (9)' },
              { id: 'public_demo', label: 'Domínio Público & Demo (5)' },
              { id: 'internal_validation', label: 'Pesquisa & Validação (3)' },
              { id: 'restricted_or_pending', label: 'Restrito DRM / TOS (1)' },
            ].map((f) => {
              const isSelected = catalogFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setCatalogFilter(f.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--accent-subtle)' : 'var(--surface-base)',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all var(--duration-fast) var(--ease-spring)',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Listagem de Ativos do Catálogo */}
          {catalogLoading ? (
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
              {[1, 2, 3].map((n) => (
                <Card key={n} elevation={1} style={{ padding: 22, height: 320 }}>
                  <Skeleton width="50%" height="20px" style={{ marginBottom: 12 }} />
                  <Skeleton width="75%" height="24px" style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height="16px" style={{ marginBottom: 18 }} />
                  <Skeleton width="100%" height="80px" style={{ marginBottom: 20 }} />
                  <Skeleton width="100%" height="36px" radius="var(--radius-pill)" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
              {(catalogData?.assets || [])
                .filter((asset) => {
                  if (catalogFilter === 'all') return true;
                  return asset.targetCollection === catalogFilter;
                })
                .map((asset) => {
                  const badge = getRightsBadge(asset);
                  return (
                    <Card
                      key={asset.id}
                      elevation={1}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 22,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {badge.text}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              background: 'var(--surface-overlay)',
                              border: '1px solid var(--border-subtle)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                            }}
                          >
                            {asset.genre} · {asset.releaseYear || 'Histórico'}
                          </span>
                        </div>

                        <h3 style={{ margin: '14px 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {asset.title}
                        </h3>
                        <p style={{ color: 'var(--accent-neon)', fontSize: 13, margin: '0 0 12px', fontWeight: 600 }}>
                          {asset.artist}
                        </p>

                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            background: 'var(--surface-overlay)',
                            border: '1px solid var(--border-subtle)',
                            padding: 12,
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 14,
                          }}
                        >
                          <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Composição:</strong>{' '}
                            {asset.rightsHolder?.compositionAuthor || 'N/A'}{' '}
                            {asset.rightsHolder?.isCompositionPublicDomain ? '(Domínio Público)' : ''}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Fonograma:</strong>{' '}
                            {asset.rightsHolder?.recordingPerformer || 'N/A'}{' '}
                            {asset.rightsHolder?.isPhonogramPublicDomain ? '(Domínio Público)' : ''}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            "{asset.attribution?.creditText}"
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, marginBottom: 16 }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: asset.hasStems ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-overlay)',
                              color: asset.hasStems ? 'var(--accent-neon)' : 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                              fontWeight: 500,
                            }}
                          >
                            {asset.hasStems ? '✓ Stems Isolados' : 'Mixdown Estéreo'}
                          </span>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: asset.hasGroundTruthTab ? 'rgba(59, 130, 246, 0.12)' : 'var(--surface-overlay)',
                              color: asset.hasGroundTruthTab ? 'var(--accent-electric)' : 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                              fontWeight: 500,
                            }}
                          >
                            {asset.hasGroundTruthTab ? '✓ Tab de Referência' : 'Transcrição Estimada'}
                          </span>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'var(--surface-overlay)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {asset.durationSeconds}s
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
                        <Link to="/converter" style={{ flex: 1 }}>
                          <Button variant="secondary" size="sm" style={{ width: '100%', fontSize: 12 }}>
                            Processar Áudio
                          </Button>
                        </Link>
                        <span
                          style={{
                            flex: 1,
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            background: 'var(--surface-overlay)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 8px',
                            fontWeight: 500,
                          }}
                        >
                          {asset.isPublicDomain ? 'Domínio Público Integral' : 'Direitos Verificados'}
                        </span>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
