// src/pages/SetlistsPage.tsx
// Gestão de Repertórios, Ordem de Músicas e Convenções de Palco (Phase 11)

import { useState, useEffect } from 'react';
import { setlistService } from '@/services/setlistService';
import { musicService } from '@/services/musicService';
import { Setlist, SetlistItem, reorderSetlistItems, detectTuningTransitions, TuningTransition } from '@/engine/setlists';
import { Song } from '@/types/domain';

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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const lists = await setlistService.list();
      setLists(lists);
      if (lists.length > 0 && !activeSetlist) {
        setActiveSetlist(lists[0]);
      }
      const lib = await musicService.listLibrary(1, 50);
      setLibrarySongs(lib.items);
    } catch (err) {
      console.error('Erro ao carregar repertórios:', err);
    } finally {
      setLoading(false);
    }
  }

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  async function handleCreateSetlist(e: React.FormEvent) {
    e.preventDefault();
    if (!newSetName.trim()) return;
    try {
      const created = await setlistService.create({
        name: newSetName.trim(),
        description: newSetDesc.trim(),
      });
      setLists([...setlists, created]);
      setActiveSetlist(created);
      setNewSetName('');
      setNewSetDesc('');
      setIsCreating(false);
      notify('Repertório criado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar repertório.');
    }
  }

  async function handleDeleteSetlist(id: string) {
    if (!confirm('Deseja realmente excluir este repertório?')) return;
    try {
      await setlistService.delete(id);
      const remaining = setlists.filter((s) => s.id !== id);
      setLists(remaining);
      setActiveSetlist(remaining.length > 0 ? remaining[0] : null);
      notify('Repertório excluído.');
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir repertório.');
    }
  }

  async function handleAddSongToActive() {
    if (!activeSetlist || !selectedSongId) return;
    const song = librarySongs.find((s) => s.id === selectedSongId);
    if (!song) return;

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
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar música.');
    }
  }

  async function handleMoveItem(index: number, direction: 'up' | 'down') {
    if (!activeSetlist) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeSetlist.items.length) return;

    const reordered = reorderSetlistItems(activeSetlist, index, targetIndex);
    try {
      const updated = await setlistService.update(reordered.id, {
        items: reordered.items,
      });
      setActiveSetlist(updated);
      setLists(setlists.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      alert(err.message || 'Erro ao reordenar.');
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!activeSetlist) return;
    const filtered = activeSetlist.items.filter((it) => it.id !== itemId);
    try {
      const updated = await setlistService.update(activeSetlist.id, {
        items: filtered,
      });
      setActiveSetlist(updated);
      setLists(setlists.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      alert(err.message || 'Erro ao remover item.');
    }
  }

  const tuningTransitions = activeSetlist ? detectTuningTransitions(activeSetlist) : [];

  return (
    <div className="page" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Repertórios & Ensaios ao Vivo</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Coordenação de setlists de banda, transições de afinação e anotações de palco em tempo real.
          </p>
        </div>
        <button
          className="btn"
          onClick={() => setIsCreating(true)}
          style={{ background: '#10b981', color: '#000', fontWeight: 600 }}
        >
          + Novo Repertório
        </button>
      </div>

      {notification && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#10b981',
          padding: '8px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
        }}>
          {notification}
        </div>
      )}

      {/* Modal / Formulário de Criação */}
      {isCreating && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid #10b981' }}>
          <h3 style={{ marginTop: 0 }}>Criar Novo Repertório de Show/Ensaio</h3>
          <form onSubmit={handleCreateSetlist} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nome do Repertório / Ensaio *</label>
              <input
                type="text"
                required
                placeholder="Ex.: Show Festival de Inverno 2026"
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#0a0a10', border: '1px solid var(--border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Descrição / Observações de Banda</label>
              <input
                type="text"
                placeholder="Ex.: Setlist de 45 minutos com afinação Drop D na faixa 3"
                value={newSetDesc}
                onChange={(e) => setNewSetDesc(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#0a0a10', border: '1px solid var(--border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn" style={{ background: '#10b981', color: '#000', fontWeight: 600 }}>
                Salvar Repertório
              </button>
              <button type="button" className="btn secondary" onClick={() => setIsCreating(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Carregando repertórios...</p>
      ) : setlists.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>Nenhum repertório cadastrado ainda.</p>
          <button className="btn" onClick={() => setIsCreating(true)} style={{ marginTop: 12, background: '#10b981', color: '#000', fontWeight: 600 }}>
            Criar Primeiro Repertório
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
          {/* Coluna Lateral: Lista de Setlists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--text-muted)' }}>Meus Repertórios</h4>
            {setlists.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveSetlist(s)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: activeSetlist?.id === s.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
                  border: activeSetlist?.id === s.id ? '1px solid #10b981' : '1px solid var(--border)',
                  color: activeSetlist?.id === s.id ? '#10b981' : 'var(--text)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {s.items.length} {s.items.length === 1 ? 'música' : 'músicas'}
                </div>
              </div>
            ))}
          </div>

          {/* Coluna Principal: Itens do Setlist Ativo */}
          {activeSetlist && (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>{activeSetlist.name}</h2>
                  {activeSetlist.description && (
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      {activeSetlist.description}
                    </p>
                  )}
                </div>
                <button
                  className="btn secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: 12 }}
                  onClick={() => handleDeleteSetlist(activeSetlist.id)}
                >
                  Excluir Repertório
                </button>
              </div>

              {/* Alerta de Transições de Afinação no Palco */}
              {tuningTransitions.length > 0 && (
                <div style={{
                  background: 'rgba(255, 209, 102, 0.1)',
                  border: '1px solid #ffd166',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#ffd166',
                }}>
                  ⚠️ <strong>Atenção para Troca de Afinação / Instrumento:</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: 20 }}>
                    {tuningTransitions.map((t: TuningTransition, idx: number) => (
                      <li key={idx}>
                        Da faixa #{t.fromIndex + 1} para #{t.toIndex + 1}: afinação muda de <em>{t.fromTuning}</em> para <em>{t.toTuning}</em>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lista de Músicas Ordenadas */}
              {activeSetlist.items.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic', margin: '20px 0' }}>
                  Nenhuma música neste repertório ainda. Adicione abaixo uma música da sua biblioteca.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
                  {activeSetlist.items.map((it, idx) => (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#09090b',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{it.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {it.artist} · Tom: {it.key} · BPM: {it.bpm} · {it.tuning}
                          </div>
                          {it.stageNotes && (
                            <div style={{ fontSize: 11, color: '#3ddc97', marginTop: 2 }}>
                              💬 Cue: {it.stageNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          className="btn secondary"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          style={{ padding: '2px 8px', fontSize: 12 }}
                          title="Subir posição"
                        >
                          ▲
                        </button>
                        <button
                          className="btn secondary"
                          disabled={idx === activeSetlist.items.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          style={{ padding: '2px 8px', fontSize: 12 }}
                          title="Descer posição"
                        >
                          ▼
                        </button>
                        <button
                          className="btn secondary"
                          onClick={() => handleRemoveItem(it.id)}
                          style={{ padding: '2px 8px', fontSize: 12, color: '#ef4444' }}
                          title="Remover do repertório"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Seção de Adicionar Música da Biblioteca */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 20 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Adicionar Faixa da Biblioteca</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
                  <select
                    value={selectedSongId}
                    onChange={(e) => setSelectedSongId(e.target.value)}
                    style={{ padding: '8px 12px', background: '#0a0a10', border: '1px solid var(--border)', borderRadius: 6, color: '#fff' }}
                  >
                    <option value="">Selecione uma música...</option>
                    {librarySongs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} — {s.artist} ({s.instrument || 'Guitarra'})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Observação de palco (ex.: Capo 2, Solo overdrive)"
                    value={stageNotes}
                    onChange={(e) => setStageNotes(e.target.value)}
                    style={{ padding: '8px 12px', background: '#0a0a10', border: '1px solid var(--border)', borderRadius: 6, color: '#fff' }}
                  />

                  <button
                    className="btn"
                    disabled={!selectedSongId}
                    onClick={handleAddSongToActive}
                    style={{ background: '#10b981', color: '#000', fontWeight: 600 }}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
