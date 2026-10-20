// src/pages/TabViewerPage.tsx
// Visualizador e Validador Interativo de Tablatura do Ontabs
// Com Inteligência de Arranjo Coletivo, Adaptação Multi-Instrumental, EQ de Estudo e Afinador

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tab, Instrument } from '@/types/domain';
import { tabService } from '@/services/tabService';
import { validateTabNotes, TabValidationResult } from '@/engine/tabValidation';
import { ArrangementMapViewer } from '@/components/ArrangementMapViewer';
import { MultiInstrumentAdapter } from '@/components/MultiInstrumentAdapter';
import { EqualizerControl } from '@/components/EqualizerControl';
import { ActiveListenerWidget } from '@/components/ActiveListenerWidget';
import { Button, Card } from '@/components/ui';

export function TabViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<TabValidationResult | null>(null);
  const [currentInstrument, setCurrentInstrument] = useState<Instrument>('guitar');
  const [currentDifficulty, setCurrentDifficulty] = useState<string>('intermediate');
  const [activeTabTool, setActiveTabTool] = useState<'tab' | 'arrangement' | 'eq' | 'tuner'>('tab');

  useEffect(() => {
    async function loadTab() {
      if (!id) return;
      try {
        const data = await tabService.get(id);
        if (data) {
          setTab(data);
          setCurrentInstrument(data.instrument || 'guitar');
          setCurrentDifficulty(data.difficulty || 'intermediate');
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
    return (
      <div className="page" style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
        <p className="page-subtitle">Carregando tablatura...</p>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="page" style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
        <Card elevation={1} style={{ padding: 36 }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <h2 style={{ fontSize: 20, margin: '16px 0 8px', color: 'var(--text-primary)' }}>Tablatura não encontrada</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            O identificador solicitado não corresponde a nenhuma tablatura válida registrada no catálogo local.
          </p>
          <Link to="/library">
            <Button variant="secondary">Voltar para a biblioteca</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const stringNames = currentInstrument === 'bass'
    ? ['G', 'D', 'A', 'E']
    : currentInstrument === 'ukulele'
    ? ['A', 'E', 'C', 'G']
    : ['e', 'B', 'G', 'D', 'A', 'E'];

  return (
    <div className="page" style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link to="/library" style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            ← Voltar à Biblioteca
          </Link>
          <h1 className="page-title" style={{ marginTop: 4, marginBottom: 4 }}>{tab.title}</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {tab.artist} · Instrumento Atual: <strong style={{ color: 'var(--accent-primary)' }}>{currentInstrument.toUpperCase()}</strong> · BPM: {tab.bpm} · Dificuldade: {currentDifficulty.toUpperCase()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/play/${tab.songId || tab.id}`}>
            <Button variant="primary">
              Tocar no OnTabs Play
            </Button>
          </Link>
        </div>
      </div>

      {/* Seletor de Ferramenta / Aba */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {[
          { id: 'tab', label: '🎼 Tablatura & Arranjo', icon: '🎼' },
          { id: 'arrangement', label: '🗺️ Mapa de Duas Guitarras & Banda', icon: '🗺️' },
          { id: 'eq', label: '🎚️ Equalizador de Estudo (5 Faixas)', icon: '🎚️' },
          { id: 'tuner', label: '🎙️ Ouvinte Ativo & Afinador (Cents)', icon: '🎙️' },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTabTool(tool.id as any)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: activeTabTool === tool.id ? '1px solid #10b981' : '1px solid var(--border)',
              background: activeTabTool === tool.id ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
              color: activeTabTool === tool.id ? '#10b981' : 'var(--text-muted)',
              fontWeight: activeTabTool === tool.id ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* Multi-Instrument Adaptation Panel ("Toque do Seu Jeito") */}
      <MultiInstrumentAdapter
        currentInstrument={currentInstrument}
        currentDifficulty={currentDifficulty}
        onInstrumentChange={(inst) => setCurrentInstrument(inst)}
        onDifficultyChange={(diff) => setCurrentDifficulty(diff)}
      />

      {/* Conteúdo Dinâmico por Ferramenta */}
      {activeTabTool === 'arrangement' && (
        <ArrangementMapViewer durationSeconds={tab.durationSeconds || 120} />
      )}

      {activeTabTool === 'eq' && (
        <EqualizerControl />
      )}

      {activeTabTool === 'tuner' && (
        <ActiveListenerWidget />
      )}

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
            <span style={{ color: '#10b981' }}>✓ Tablatura 100% válida e ergonomicamente compatível com {currentInstrument}.</span>
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
        <div>Afinação: {stringNames.join(' ')}</div>
        <div>Dificuldade: {currentDifficulty.toUpperCase()}</div>
      </div>
    </div>
  );
}
