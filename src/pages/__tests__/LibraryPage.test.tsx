// src/pages/__tests__/LibraryPage.test.tsx
// Testes de Regressão e Integridade da Biblioteca OnTabs (Gate V.2B.1.1)

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LibraryPage } from '../LibraryPage';
import { Song } from '@/types/domain';

const MOCK_VALID_SONG: Song = {
  id: 'song_demo_canon_rock',
  title: 'Canon Rock Theme',
  artist: 'JerryC / Pachelbel',
  durationSeconds: 120,
  bpm: 130,
  key: 'D',
  instrument: 'guitar',
  status: 'ready',
  tabId: 'tab_demo_canon_rock',
};

describe('LibraryPage Regression & Integrity (Gate V.2B.1.1)', () => {
  beforeAll(() => {
    // Suprime warnings cosméticos de useLayoutEffect emitidos pelo react-router em renderToStaticMarkup
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  // 1. Renderização de faixas válidas
  it('1. Deve renderizar a biblioteca quando existem faixas válidas no acervo', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryPage
          initialLoading={false}
          initialData={{
            items: [MOCK_VALID_SONG],
            total: 1,
            page: 1,
            pageSize: 6,
            totalPages: 1,
          }}
        />
      </MemoryRouter>
    );

    expect(html).toContain('Canon Rock Theme');
    expect(html).toContain('JerryC / Pachelbel');
    expect(html).toContain('href="/tab/tab_demo_canon_rock"');
    expect(html).toContain('href="/play/song_demo_canon_rock"');
  });

  // 2. Resposta vazia sem fabricação de faixas sintéticas
  it('2. Deve renderizar estado honesto sem fabricar faixas quando a fonte de dados retorna vazio', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryPage
          initialLoading={false}
          initialData={{
            items: [],
            total: 0,
            page: 1,
            pageSize: 6,
            totalPages: 1,
          }}
        />
      </MemoryRouter>
    );

    expect(html).toContain('Sua Biblioteca Musical');
    expect(html).toContain('Você ainda não possui músicas salvas no seu acervo pessoal');
    expect(html).not.toContain('The Beatles');
    expect(html).not.toContain('Come Together');
    expect(html).not.toContain('Metallica');
    expect(html).not.toContain('Master of Puppets');
  });

  // 3. Busca sem resultados apresenta estado vazio e ação para limpar filtros
  it('3. Deve exibir estado vazio e botão para limpar filtros quando busca não encontra resultados', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryPage
          initialLoading={false}
          initialSearch="termo_inexistente_999"
          initialData={{
            items: [],
            total: 0,
            page: 1,
            pageSize: 6,
            totalPages: 1,
          }}
        />
      </MemoryRouter>
    );

    expect(html).toContain('Nenhuma música encontrada');
    expect(html).toContain('Nenhum resultado corresponde à busca ou ao filtro de instrumento selecionado.');
    expect(html).toContain('Limpar Filtros de Pesquisa');
    expect(html).not.toContain('The Beatles');
  });

  // 4. Filtro de instrumento sem correspondências mantém integridade sem recorrer a mocks
  it('4. Deve manter o filtro de instrumento ativo sem recorrer a mocks falsos de catálogo', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryPage
          initialLoading={false}
          initialSegment="bass"
          initialData={{
            items: [],
            total: 0,
            page: 1,
            pageSize: 6,
            totalPages: 1,
          }}
        />
      </MemoryRouter>
    );

    expect(html).toContain('Nenhuma música encontrada');
    expect(html).toContain('Limpar Filtros de Pesquisa');
    // Assegura que faixas antigas de baixo (Come Together, Hysteria) NÃO foram injetadas
    expect(html).not.toContain('Come Together');
    expect(html).not.toContain('Hysteria (Distorted Bassline)');
  });

  // 5. Ação explícita para abrir a demonstração canônica no Play
  it('5. Deve disponibilizar link explícito para /play/song_demo_canon_rock na biblioteca vazia', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryPage
          initialLoading={false}
          initialData={{
            items: [],
            total: 0,
            page: 1,
            pageSize: 6,
            totalPages: 1,
          }}
        />
      </MemoryRouter>
    );

    expect(html).toContain('href="/play/song_demo_canon_rock"');
    expect(html).toContain('Tocar Demo: Canon Rock');
  });

  // 6. Ação explícita para abrir o conversor
  it('6. Deve disponibilizar link explícito para /converter na biblioteca vazia', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryPage
          initialLoading={false}
          initialData={{
            items: [],
            total: 0,
            page: 1,
            pageSize: 6,
            totalPages: 1,
          }}
        />
      </MemoryRouter>
    );

    expect(html).toContain('href="/converter"');
    expect(html).toContain('Processar Áudio no Conversor');
  });

  // 7. Ausência total das 8 faixas fictícias antigas e de referências a tabId: "demo"
  it('7. Deve garantir ausência absoluta de faixas mockadas não licenciadas e de tabId: "demo"', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryPage
          initialLoading={false}
          initialData={{
            items: [MOCK_VALID_SONG],
            total: 1,
            page: 1,
            pageSize: 6,
            totalPages: 1,
          }}
        />
      </MemoryRouter>
    );

    // Mocks não autorizados que constavam em PUBLIC_DEMO_SONGS
    expect(html).not.toContain('The Beatles');
    expect(html).not.toContain('Hotel California');
    expect(html).not.toContain('Billie Jean');
    expect(html).not.toContain('Careless Whisper');
    expect(html).not.toContain('Master of Puppets');
    expect(html).not.toContain('Autumn Leaves');
    expect(html).not.toContain('Hysteria');
    expect(html).not.toContain('href="/tab/demo"');
    expect(html).not.toContain('Modo Demonstração Pública');
  });
});
