// src/pages/SetlistsPage.tsx
// Gestão de Repertórios, Ordem de Músicas e Convenções de Palco (Phase 11 / Gate K.3.2)

import React, { useState, useEffect } from 'react';
import { setlistService } from '@/services/setlistService';
import { musicService } from '@/services/musicService';
import {
  Setlist,
  SetlistItem,
  reorderSetlistItems,
  detectTuningTransitions,
  TuningTransition,
} from '@/engine/setlists';
import { Song } from '@/types/domain';
import { Button, Card, Input, Skeleton } from '@/components/ui';

export function SetlistsPage() {
  const [setlists, setLists] = useState<Setlist[]>([]);
  const [activeSetlist, setActiveSetlist] = useState<Setlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [librarySongs, setLibrarySongs] = useState<Song[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDesc, setNewSetDesc] = useState('');
  const [selectedSongId, setSelectedSongId] = useState('');
  const [stageNotes, setStageNotes] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const lists = await setlistService.list();
      setLists(lists);
      if (lists.length > 0 && !activeSetlist) {
        setActiveSetlist(lists[0]);
      }
      const lib = await musicService.listLibrary(1, 50);
      setLibrarySongs(lib.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar repertórios.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  }

  async function handleCreateSetlist(e: React.FormEvent) {
    e.preventDefault();
    if (!newSetName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await setlistService.create({
        name: newSetName.trim(),
        description: newSetDesc.trim(),
      });
      const updatedList = [...setlists, created];
      setLists(updatedList);
      setActiveSetlist(created);
      setNewSetName('');
      setNewSetDesc('');
      setIsCreating(false);
      notify('Repertório criado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar repertório.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function executeDeleteSetlist(id: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await setlistService.delete(id);
      const remaining = setlists.filter((s) => s.id !== id);
      setLists(remaining);
      setActiveSetlist(remaining.length > 0 ? remaining[0] : null);
      setConfirmDeleteId(null);
      notify('Repertório excluído com sucesso.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir repertório.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddSongToActive() {
    if (!activeSetlist || !selectedSongId || isSubmitting) return;
    const song = librarySongs.find((s) => s.id === selectedSongId);
    if (!song) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    const newItem: SetlistItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      songId: song.id,
      title: song.title,
      artist: song.artist,
      targetInstrument: song.instrument || 'guitar',
      tuning: 'E A D G B E',
      bpm: song.bpm || 120,
      targetBpm: song.bpm || 120,
      key: song.key || 'C',
      stageNotes: stageNotes.trim() || undefined,
    };

    const updatedItems = [...activeSetlist.items, newItem];
    try {
      const updated = await setlistService.update(activeSetlist.id, {
        items: updatedItems,
      });
      setActiveSetlist(updated);
      setLists(setlists.map((s) => (s.id === updated.id ? updated : s)));
      setSelectedSongId('');
      setStageNotes('');
      notify(`"${song.title}" adicionada ao repertório.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar música.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMoveItem(index: number, direction: 'up' | 'down') {
    if (!activeSetlist || isMoving) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeSetlist.items.length) return;

    setIsMoving(true);
    setErrorMessage(null);
    const reordered = reorderSetlistItems(activeSetlist, index, targetIndex);
    try {
      const updated = await setlistService.update(reordered.id, {
        items: reordered.items,
      });
      setActiveSetlist(updated);
      setLists(setlists.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao reordenar faixa.';
      setErrorMessage(msg);
    } finally {
      setIsMoving(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!activeSetlist || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    const filtered = activeSetlist.items.filter((it) => it.id !== itemId);
    try {
      const updated = await setlistService.update(activeSetlist.id, {
        items: filtered,
      });
      setActiveSetlist(updated);
      setLists(setlists.map((s) => (s.id === updated.id ? updated : s)));
      notify('Faixa removida do repertório.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover música.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const tuningTransitions: TuningTransition[] = activeSetlist
    ? detectTuningTransitions(activeSetlist)
    : [];

  return (
    <div className="page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>
      {/* Estilos responsivos com controle de viewport */}
      <style>{`
        .setlists-layout {
          display: grid;
          grid-template-columns: minmax(260px, 320px) 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 820px) {
          .setlists-layout {
            grid-template-columns: 1fr;
          }
        }
        .setlist-add-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 12px;
          align-items: flex-end;
        }
        @media (max-width: 680px) {
          .setlist-add-grid {
            grid-template-columns: 1fr;
          }
        }
        .select-dark {
          width: 100%;
          background: var(--surface-base);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color var(--duration-fast) var(--ease-spring);
        }
        .select-dark:focus {
          border-color: var(--accent-primary);
        }
      `}</style>

      {/* Cabeçalho da Página */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Repertórios & Ensaios ao Vivo
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0 0' }}>
            Coordenação de setlists de banda, transições de afinação e anotações de palco em tempo real.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setIsCreating(true);
            setErrorMessage(null);
          }}
        >
          + Novo Repertório
        </Button>
      </div>

      {/* Alerta de Notificação / Sucesso */}
      {notification && (
        <div
          role="status"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--accent-neon)',
            color: 'var(--accent-neon)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Alerta de Erro Acessível */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-coral)',
            color: 'var(--accent-coral)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            aria-label="Fechar mensagem de erro"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-coral)',
              cursor: 'pointer',
              fontSize: 16,
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Formulário de Criação de Repertório */}
      {isCreating && (
        <Card
          elevation={2}
          style={{
            marginBottom: 24,
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, color: 'var(--text-primary)' }}>
            Criar Novo Repertório de Show / Ensaio
          </h3>
          <form onSubmit={handleCreateSetlist} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Nome do Repertório / Ensaio *"
              required
              placeholder="Ex.: Show Festival de Inverno 2026"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
            />
            <Input
              label="Descrição / Observações de Banda"
              placeholder="Ex.: Setlist de 45 minutos com afinação Drop D na faixa 3"
              value={newSetDesc}
              onChange={(e) => setNewSetDesc(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Salvar Repertório
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => {
                  setIsCreating(false);
                  setNewSetName('');
                  setNewSetDesc('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Estado de Carregamento com Skeletons */}
      {loading ? (
        <div className="setlists-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton height={20} width="60%" style={{ marginBottom: 6 }} />
            <Skeleton height={64} radius="var(--radius-md)" />
            <Skeleton height={64} radius="var(--radius-md)" />
            <Skeleton height={64} radius="var(--radius-md)" />
          </div>
          <Card elevation={1}>
            <Skeleton height={28} width="40%" style={{ marginBottom: 12 }} />
            <Skeleton height={16} width="70%" style={{ marginBottom: 24 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height={56} radius="var(--radius-md)" />
              <Skeleton height={56} radius="var(--radius-md)" />
              <Skeleton height={56} radius="var(--radius-md)" />
            </div>
          </Card>
        </div>
      ) : setlists.length === 0 ? (
        /* Estado Vazio */
        <Card elevation={1} style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Nenhum repertório cadastrado ainda
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 20px auto' }}>
            Crie o primeiro repertório para organizar músicas da sua biblioteca, monitorar trocas de afinação no palco
            e sincronizar observações para a banda.
          </p>
          <Button variant="primary" onClick={() => setIsCreating(true)}>
            + Criar Primeiro Repertório
          </Button>
        </Card>
      ) : (
        /* Layout Principal Responsivo */
        <div className="setlists-layout">
          {/* Coluna Lateral: Lista de Setlists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Meus Repertórios
              </h4>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {setlists.length} {setlists.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {setlists.map((s) => {
              const isActive = activeSetlist?.id === s.id;
              return (
                <Card
                  key={s.id}
                  elevation={isActive ? 2 : 1}
                  interactive={true}
                  onClick={() => {
                    setActiveSetlist(s);
                    setConfirmDeleteId(null);
                    setErrorMessage(null);
                  }}
                  style={{
                    padding: '14px 16px',
                    borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    background: isActive ? 'var(--accent-subtle)' : 'var(--surface-base)',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {s.items.length} {s.items.length === 1 ? 'música' : 'músicas'}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Coluna Principal: Detalhes do Setlist Ativo */}
          {activeSetlist && (
            <Card elevation={2} style={{ padding: '24px' }}>
              {/* Barra de Título do Setlist Ativo */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 20,
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 16,
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>
                    {activeSetlist.name}
                  </h2>
                  {activeSetlist.description && (
                    <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                      {activeSetlist.description}
                    </p>
                  )}
                </div>
                <div>
                  {confirmDeleteId !== activeSetlist.id ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmDeleteId(activeSetlist.id)}
                    >
                      Excluir Repertório
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Banner de Confirmação de Exclusão (Substitui confirm() nativo) */}
              {confirmDeleteId === activeSetlist.id && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid var(--accent-coral)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-coral)', marginBottom: 8 }}>
                    ⚠️ Confirmar exclusão do repertório?
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
                    Tem certeza de que deseja excluir <strong>"{activeSetlist.name}"</strong>? Essa ação é permanente e removerá todas as anotações associadas.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={isSubmitting}
                      onClick={() => executeDeleteSetlist(activeSetlist.id)}
                    >
                      Sim, Excluir Definitivamente
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Alerta de Transições de Afinação / Troca de Instrumento no Palco */}
              {tuningTransitions.length > 0 && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid var(--accent-amber)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    marginBottom: 20,
                    color: 'var(--accent-amber)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                    <span>⚠️</span>
                    <span>Atenção para Troca de Afinação / Instrumento no Palco:</span>
                  </div>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: 22, fontSize: 13, lineHeight: '1.6' }}>
                    {tuningTransitions.map((t: TuningTransition, idx: number) => (
                      <li key={idx}>
                        Da faixa #{t.fromIndex + 1} para #{t.toIndex + 1}: afinação muda de{' '}
                        <strong>{t.fromTuning}</strong> para <strong>{t.toTuning}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lista Ordenada de Músicas */}
              {activeSetlist.items.length === 0 ? (
                <Card
                  elevation={1}
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    margin: '16px 0 24px 0',
                    border: '1px dashed var(--border-default)',
                    background: 'transparent',
                  }}
                >
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                    Nenhuma música neste repertório ainda. Selecione uma faixa da sua biblioteca abaixo para começar.
                  </p>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0 24px 0' }}>
                  {activeSetlist.items.map((it, idx) => (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--surface-base)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        gap: 12,
                        transition: 'border-color var(--duration-fast) var(--ease-spring)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            minWidth: 28,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-overlay)',
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {it.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              marginTop: 2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {it.artist} • Tom: {it.key} • BPM: {it.bpm} • {it.tuning}
                          </div>
                          {it.stageNotes && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 500,
                                color: 'var(--accent-primary)',
                                background: 'var(--accent-subtle)',
                                border: '1px solid var(--border-subtle)',
                                padding: '1px 8px',
                                borderRadius: 'var(--radius-sm)',
                                marginTop: 4,
                              }}
                            >
                              <span>🎤 Cue:</span>
                              <span>{it.stageNotes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={idx === 0 || isMoving}
                          onClick={() => handleMoveItem(idx, 'up')}
                          aria-label={`Subir posição de ${it.title}`}
                          title="Subir posição"
                          style={{ minWidth: 32, padding: '4px 8px' }}
                        >
                          ▲
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={idx === activeSetlist.items.length - 1 || isMoving}
                          onClick={() => handleMoveItem(idx, 'down')}
                          aria-label={`Descer posição de ${it.title}`}
                          title="Descer posição"
                          style={{ minWidth: 32, padding: '4px 8px' }}
                        >
                          ▼
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => handleRemoveItem(it.id)}
                          aria-label={`Remover ${it.title} do repertório`}
                          title="Remover do repertório"
                          style={{ minWidth: 32, padding: '4px 8px' }}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Seção: Adicionar Música da Biblioteca */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 20,
                  marginTop: 10,
                }}
              >
                <h4 style={{ margin: '0 0 14px 0', fontSize: 15, color: 'var(--text-primary)' }}>
                  Adicionar Faixa da Biblioteca
                </h4>
                <div className="setlist-add-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label
                      htmlFor="library-song-select"
                      style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}
                    >
                      Música da Biblioteca
                    </label>
                    <select
                      id="library-song-select"
                      className="select-dark"
                      value={selectedSongId}
                      onChange={(e) => setSelectedSongId(e.target.value)}
                    >
                      <option value="">Selecione uma música...</option>
                      {librarySongs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} — {s.artist} ({s.instrument || 'Guitarra'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Observação de Palco (Cue)"
                    placeholder="Ex.: Capo 2, Solo com overdrive"
                    value={stageNotes}
                    onChange={(e) => setStageNotes(e.target.value)}
                  />

                  <div>
                    <Button
                      variant="primary"
                      disabled={!selectedSongId || isSubmitting}
                      isLoading={isSubmitting}
                      onClick={handleAddSongToActive}
                      style={{ width: '100%', height: 42 }}
                    >
                      + Adicionar Faixa
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
