// src/pages/TabViewerPage.tsx
// Visualizador e Validador Interativo de Tablatura do Ontabs

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tab } from '@/types/domain';
import { tabService } from '@/services/tabService';
import { validateTabNotes, TabValidationResult } from '@/engine/tabValidation';

export function TabViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<TabValidationResult | null>(null);

  useEffect(() => {
    async function loadTab() {
      if (!id) return;
      try {
        const data = await tabService.get(id);
        if (data) {
          setTab(data);
          // Executa validação de integridade musical
          const val = validateTabNotes(
            (data.notes || []).map((n: any) => ({
              stringNumber: n.stringNumber || (n.strings ? n.strings[0] : 1),
              fret: n.fret !== undefined ? n.fret : 0,
              timestamp: n.timestamp || 0,
              duration: n.duration,
            })),
            data.instrument
          );
          setValidation(val);
        }
      } catch (err) {
        console.error('Erro ao carregar tablatura:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTab();
  }, [id]);

  if (loading) {
    return <div className="page"><p>Carregando tablatura...</p></div>;
  }

  if (!tab) {
    return (
      <div className="page">
        <p>Tablatura não encontrada.</p>
        <Link to="/library" className="btn">Voltar para a biblioteca</Link>
      </div>
    );
  }

  const stringCount = tab.instrument === 'bass' || tab.instrument === 'ukulele' ? 4 : 6;
  const stringNames = tab.tuning && tab.tuning.length === stringCount
    ? [...tab.tuning].reverse() // Corda 1 (mais aguda) no topo
    : stringCount === 4 ? ['G', 'D', 'A', 'E'] : ['e', 'B', 'G', 'D', 'A', 'E'];

  return (
    <div className="page" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Link to="/library" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Biblioteca</Link>
          <h1 className="page-title" style={{ marginTop: 4, marginBottom: 4 }}>{tab.title}</h1>
          <p className="page-subtitle">
            {tab.artist} · {tab.instrument.toUpperCase()} · BPM: {tab.bpm} · Afinação: {tab.tuning?.join(' ')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/play/${tab.id}`} className="btn" style={{ background: '#10b981', color: '#000', fontWeight: 600 }}>
            🎮 Tocar no OnTabs Play
          </Link>
        </div>
      </div>

      {/* Relatório de Validação Musical de Domínio */}
      {validation && (
        <div style={{
          background: validation.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${validation.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          fontSize: 13,
        }}>
          <strong>Validação Física do Instrumento: </strong>
          {validation.isValid ? (
            <span style={{ color: '#10b981' }}>✓ Tablatura 100% válida e ergonomicamente compatível com {tab.instrument}.</span>
          ) : (
            <span style={{ color: '#ef4444' }}>Foram detectados {validation.errors.length} conflitos físicos na partitura.</span>
          )}
          {validation.errors.length > 0 && (
            <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18 }}>
              {validation.errors.map((err, i) => (
                <li key={i}>{err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Grid de Tablatura (Staff) */}
      <div className="card" style={{ overflowX: 'auto', padding: '24px 16px', background: '#09090b', fontFamily: 'monospace' }}>
        <div style={{ minWidth: 600 }}>
          {stringNames.map((strName, strIdx) => {
            const stringNumber = strIdx + 1; // 1 = mais aguda
            return (
              <div key={stringNumber} style={{ display: 'flex', alignItems: 'center', height: 28, position: 'relative' }}>
                <div style={{ width: 30, fontWeight: 'bold', color: '#10b981' }}>{strName}|</div>
                <div style={{ flex: 1, height: 2, background: '#27272a', position: 'relative' }}>
                  {/* Notas posicionadas ao longo da corda */}
                  {tab.notes && tab.notes
                    .filter((n: any) => (n.stringNumber || (n.strings ? n.strings[0] : 1)) === stringNumber)
                    .map((n: any, noteIdx) => {
                      const leftPercent = Math.min(95, Math.max(5, (n.timestamp / (tab.durationSeconds || 60)) * 100));
                      return (
                        <div
                          key={noteIdx}
                          title={`Tempo: ${n.timestamp}s, Casa: ${n.fret}`}
                          style={{
                            position: 'absolute',
                            left: `${leftPercent}%`,
                            top: -11,
                            background: '#10b981',
                            color: '#000',
                            borderRadius: 4,
                            padding: '1px 5px',
                            fontSize: 12,
                            fontWeight: 'bold',
                            transform: 'translateX(-50%)',
                          }}
                        >
                          {n.fret !== undefined ? n.fret : 0}
                        </div>
                      );
                    })}
                </div>
                <div style={{ width: 10, color: '#27272a' }}>|</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 13 }}>
        <div>Total de notas detectadas: {tab.notes?.length || 0}</div>
        <div>Dificuldade: {tab.difficulty.toUpperCase()}</div>
      </div>
    </div>
  );
}
