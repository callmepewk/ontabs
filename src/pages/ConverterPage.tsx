// src/pages/ConverterPage.tsx
// Página de Conversão e Análise de Música para Tablatura do Ontabs

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CONVERSION_PIPELINE_STEPS, conversionService, ConversionStage } from '@/services/conversionService';
import { authService, EntitlementInfo } from '@/services/authService';
import { Instrument } from '@/types/domain';

const INSTRUMENTS: { key: Instrument; label: string }[] = [
  { key: 'guitar', label: 'Guitarra' },
  { key: 'acoustic_guitar', label: 'Violão' },
  { key: 'bass', label: 'Baixo' },
  { key: 'ukulele', label: 'Ukulele' },
];

export function ConverterPage() {
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [error, setError] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementInfo | null>(null);
  const [currentStage, setCurrentStage] = useState<ConversionStage | null>(null);
  const [progress, setProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalMeta, setExternalMeta] = useState<any | null>(null);
  const [resolvingUrl, setResolvingUrl] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    authService.getEntitlementStatus().then(setEntitlement).catch(() => null);
  }, []);

  async function handleResolveUrl() {
    if (!externalUrl.trim()) return;
    setError(null);
    setResolvingUrl(true);
    setExternalMeta(null);

    try {
      const res = await fetch('/api/connectors/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: externalUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao validar link.');
      setExternalMeta(data);
    } catch (err: any) {
      setError(err?.message || 'Link inválido.');
    } finally {
      setResolvingUrl(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setConverting(true);

    try {
      const job = await conversionService.startConversion(file, instrument, (stage, p) => {
        setCurrentStage(stage);
        setProgress(p);
      });

      if (job.resultTabId) {
        navigate(`/tab/${job.resultTabId}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar arquivo.');
      // Atualiza entitlement para refletir se cota foi consumida
      authService.getEntitlementStatus().then(setEntitlement).catch(() => null);
    } finally {
      setConverting(false);
    }
  }

  async function handleDemoSubmit() {
    setError(null);
    setConverting(true);

    try {
      const job = await conversionService.startConversion('Música Exemplo Studio', instrument, (stage, p) => {
        setCurrentStage(stage);
        setProgress(p);
      });

      if (job.resultTabId) {
        navigate(`/tab/${job.resultTabId}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar conversão.');
      authService.getEntitlementStatus().then(setEntitlement).catch(() => null);
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 880, margin: '0 auto' }}>
      <h1 className="page-title">Converter Música em Tablatura</h1>
      <p className="page-subtitle">
        Envie seu áudio e nosso motor musical analisa ritmo, BPM, tonalidade, acordes e dedilhados para gerar tablaturas reais.
      </p>

      {/* Banner de Entitlement e Acesso */}
      {entitlement && (
        <div style={{
          background: entitlement.isAuthorized ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${entitlement.isAuthorized ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div>
            {entitlement.accessState === 'FREE_USE_AVAILABLE' && (
              <span>🎁 <strong>Uso Gratuito Disponível</strong>: você pode realizar 1 análise completa sem cadastro.</span>
            )}
            {entitlement.accessState === 'FREE_USE_CONSUMED' && (
              <span style={{ color: '#ef4444' }}>
                ⚠️ <strong>Cota Gratuita Consumida</strong>: sua degustação gratuita foi utilizada. Cadastre-se para liberar 7 dias de trial Pro completo.
              </span>
            )}
            {entitlement.accessState === 'TRIAL_ACTIVE' && (
              <span style={{ color: '#10b981' }}>
                ✨ <strong>Trial Pro Ativo</strong>: {entitlement.remainingTrialHours} horas restantes no seu teste gratuito de 7 dias.
              </span>
            )}
            {entitlement.accessState === 'SUBSCRIPTION_ACTIVE' && (
              <span style={{ color: '#10b981' }}>
                ✓ <strong>Plano {entitlement.plan.name} Ativo</strong>: análises liberadas no seu plano.
              </span>
            )}
          </div>

          {!entitlement.isAuthorized && (
            <Link to="/register" className="btn" style={{ background: '#10b981', color: '#000', fontSize: 12, fontWeight: 600 }}>
              Ativar 7 Dias Grátis
            </Link>
          )}
        </div>
      )}

      {/* Seletor de Instrumento */}
      <div className="card" style={{ marginBottom: 20 }}>
        <strong>Instrumento de Destino</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {INSTRUMENTS.map((i) => (
            <button
              key={i.key}
              className={`btn ${instrument === i.key ? '' : 'secondary'}`}
              style={{
                background: instrument === i.key ? '#10b981' : undefined,
                color: instrument === i.key ? '#000' : undefined,
              }}
              onClick={() => setInstrument(i.key)}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fontes de Entrada */}
      <div className="card-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <strong>Upload de Arquivo</strong>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '8px 0' }}>
            MP3, WAV, OGG ou MP4 que você possua direitos de uso. A análise roda direto no seu navegador.
          </p>
          <input
            type="file"
            accept="audio/*,video/mp4"
            disabled={Boolean(converting || (entitlement && !entitlement.isAuthorized))}
            onChange={handleUpload}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>

        <div className="card">
          <strong>Demonstração Instantânea</strong>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '8px 0' }}>
            Experimente o motor musical gerando uma tablatura de demonstração calibrada.
          </p>
          <button
            className="btn secondary"
            disabled={Boolean(converting || (entitlement && !entitlement.isAuthorized))}
            onClick={handleDemoSubmit}
            style={{ marginTop: 8 }}
          >
            Gerar Tab de Demonstração
          </button>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <strong>Importar por Link (YouTube / Spotify)</strong>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '8px 0' }}>
            Valide links públicos para associar metadados oficiais e estruturar a transcrição com segurança técnica.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... ou https://open.spotify.com/track/..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={resolvingUrl}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'inherit' }}
            />
            <button
              className="btn secondary"
              disabled={resolvingUrl || !externalUrl.trim()}
              onClick={handleResolveUrl}
            >
              {resolvingUrl ? 'Validando...' : 'Validar Link'}
            </button>
          </div>

          {externalMeta && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 6,
              padding: 10,
              marginTop: 10,
              fontSize: 13,
            }}>
              <div><strong>{externalMeta.title}</strong> ({externalMeta.provider.toUpperCase()})</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{externalMeta.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* Visualização de Progresso do Pipeline */}
      {converting && (
        <div className="card" style={{ marginBottom: 20, background: '#09090b', borderColor: '#10b981' }}>
          <strong>Processando Música... {progress}%</strong>
          <div style={{ width: '100%', height: 6, background: '#27272a', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Etapa atual: {currentStage}
          </p>
        </div>
      )}

      {/* Etapas Arquiteturais do Pipeline */}
      <div className="card">
        <strong>Pipeline de Conversão e Teoria Musical</strong>
        <div className="pipeline-steps" style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {CONVERSION_PIPELINE_STEPS.map((s) => (
            <span
              key={s.stage}
              className="pipeline-step"
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                background: currentStage === s.stage ? '#10b981' : 'var(--bg-elevated)',
                color: currentStage === s.stage ? '#000' : 'var(--text-muted)',
                fontWeight: currentStage === s.stage ? 600 : 400,
              }}
            >
              {s.label}
            </span>
          ))}
          <span className="pipeline-step" style={{ padding: '6px 12px', borderRadius: 4, fontSize: 12, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            Validação Física
          </span>
          <span className="pipeline-step" style={{ padding: '6px 12px', borderRadius: 4, fontSize: 12, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            OnTabs Play
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          padding: 12,
          marginTop: 16,
          color: '#ef4444',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
