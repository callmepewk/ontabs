// src/pages/LibraryPage.tsx
// Biblioteca Musical do OnTabs — Paginação Completa e Segmentação por Clique (FASE NAV)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  musicService,
  PaginatedSongs,
  VerifiedAsset,
  CatalogResponse,
} from '@/services/musicService';
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

function getRightsBadge(asset: VerifiedAsset) {
  if (asset.isPublicDomain) {
    return {
      text: '✓ DOMÍNIO PÚBLICO',
      bg: 'rgba(16, 185, 129, 0.15)',
      color: '#10b981',
      border: 'rgba(16, 185, 129, 0.4)',
    };
  }
  if (asset.licenseId === 'CC-BY-4.0') {
    return {
      text: 'CC BY 4.0 · CRÉDITO OBRIGATÓRIO',
      bg: 'rgba(59, 130, 246, 0.15)',
      color: '#3b82f6',
      border: 'rgba(59, 130, 246, 0.4)',
    };
  }
  if (asset.licenseId?.includes('NC') || asset.licenseId?.includes('NON-COMMERCIAL')) {
    return {
      text: 'CC BY-NC-SA · NÃO COMERCIAL',
      bg: 'rgba(168, 85, 247, 0.15)',
      color: '#a855f7',
      border: 'rgba(168, 85, 247, 0.4)',
    };
  }
  return {
    text: 'RESTRITO · METADATA ONLY / DRM',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.4)',
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

      {/* Abas Principais de Seção */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 18,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 2,
      }}>
        <button
          onClick={() => setActiveTab('library')}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: activeTab === 'library' ? 700 : 500,
            color: activeTab === 'library' ? '#10b981' : 'var(--text-muted)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'library' ? '2px solid #10b981' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>📁</span>
          <span>Meu Repertório & Análises</span>
          <span style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 10,
            background: activeTab === 'library' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
            color: activeTab === 'library' ? '#10b981' : 'var(--text-muted)',
          }}>
            {data.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: activeTab === 'catalog' ? 700 : 500,
            color: activeTab === 'catalog' ? '#10b981' : 'var(--text-muted)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'catalog' ? '2px solid #10b981' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>🛡️</span>
          <span>Catálogo Soberano Verificado (Direitos & Proveniência)</span>
          <span style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 10,
            background: activeTab === 'catalog' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
            color: activeTab === 'catalog' ? '#10b981' : 'var(--text-muted)',
          }}>
            9 Obras
          </span>
        </button>
      </div>

      {activeTab === 'library' ? (
        <>
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
        </>
      ) : (
        /* Seção do Catálogo Verificado */
        <div style={{ marginTop: 18 }}>
          {/* Header Explicativo de Direitos e Soberania */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            fontSize: 13,
            lineHeight: 1.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <strong style={{ color: '#10b981', fontSize: 14 }}>
                Catálogo Auditado & Inteligência de Direitos Autorais
              </strong>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Todas as 9 obras abaixo foram catalogadas com <strong>separação tripartite de direitos</strong> (Composição, Arranjo e Fonograma) segundo a Lei 9.610/98 e convenções internacionais. Apenas obras de domínio público integral e licenças Creative Commons estritas com atribuição são liberadas para processamento e execução. Áudios protegidos por DRM (ex: Spotify) são restritos a <em>METADATA_ONLY</em> sem extração de áudio.
            </p>
          </div>

          {/* Filtros de Coleção do Catálogo */}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 12,
            marginBottom: 16,
            borderBottom: '1px solid var(--border)',
          }}>
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
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: isSelected ? '1px solid #10b981' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-elevated)',
                    color: isSelected ? '#10b981' : 'var(--text-muted)',
                    fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Listagem de Ativos do Catálogo */}
          {catalogLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Carregando catálogo verificado de obras e metadados de direitos...
            </div>
          ) : (
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {(catalogData?.assets || [])
                .filter((asset) => {
                  if (catalogFilter === 'all') return true;
                  return asset.targetCollection === catalogFilter;
                })
                .map((asset) => {
                  const badge = getRightsBadge(asset);
                  return (
                    <div
                      key={asset.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 18,
                        background: '#0e0f17',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              letterSpacing: 0.5,
                            }}
                          >
                            {badge.text}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                            {asset.genre} · {asset.releaseYear || 'Histórico'}
                          </span>
                        </div>

                        <h3 style={{ margin: '12px 0 4px', fontSize: 15 }}>{asset.title}</h3>
                        <p style={{ color: '#10b981', fontSize: 13, margin: '0 0 10px', fontWeight: 500 }}>{asset.artist}</p>

                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                          <div><strong>Composição:</strong> {asset.rightsHolder?.compositionAuthor || 'N/A'} {asset.rightsHolder?.isCompositionPublicDomain ? '(Domínio Público)' : ''}</div>
                          <div><strong>Fonograma:</strong> {asset.rightsHolder?.recordingPerformer || 'N/A'} {asset.rightsHolder?.isPhonogramPublicDomain ? '(Domínio Público)' : ''}</div>
                          <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
                            <em>"{asset.attribution?.creditText}"</em>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, marginBottom: 14 }}>
                          <span style={{ padding: '2px 6px', borderRadius: 4, background: asset.hasStems ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: asset.hasStems ? '#10b981' : 'var(--text-muted)' }}>
                            {asset.hasStems ? '✓ Stems Isolados' : 'Mixdown Estéreo'}
                          </span>
                          <span style={{ padding: '2px 6px', borderRadius: 4, background: asset.hasGroundTruthTab ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', color: asset.hasGroundTruthTab ? '#3b82f6' : 'var(--text-muted)' }}>
                            {asset.hasGroundTruthTab ? '✓ Tab de Referência' : 'Transcrição Estimada'}
                          </span>
                          <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                            {asset.durationSeconds}s
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <Link
                          to={`/tab/${asset.id}`}
                          className="btn secondary"
                          style={{ flex: 1, textAlign: 'center', fontSize: 12, padding: '8px 10px' }}
                        >
                          Ver Tablatura
                        </Link>
                        {asset.permissions?.publicPlayback === 'ALLOWED' ? (
                          <Link
                            to={`/play/${asset.id}`}
                            className="btn"
                            style={{ flex: 1, textAlign: 'center', fontSize: 12, background: '#10b981', color: '#000', padding: '8px 10px', fontWeight: 600 }}
                          >
                            🎮 Praticar (Play)
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="btn secondary"
                            style={{ flex: 1, fontSize: 11, opacity: 0.5, cursor: 'not-allowed', padding: '8px 10px' }}
                            title="Reprodução de áudio restrita pelos termos do provedor (apenas metadados)."
                          >
                            DRM Restrito
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
