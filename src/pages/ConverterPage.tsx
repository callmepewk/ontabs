// src/pages/ConverterPage.tsx
// Página de Conversão e Análise de Música para Tablatura do Ontabs

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CONVERSION_PIPELINE_STEPS, conversionService, ConversionStage } from '@/services/conversionService';
import { authService, EntitlementInfo } from '@/services/authService';
import { Instrument } from '@/types/domain';
import { Button, Card, Skeleton } from '@/components/ui';

const INSTRUMENTS: { key: Instrument; label: string; icon: string }[] = [
  { key: 'guitar', label: 'Guitarra', icon: '🎸' },
  { key: 'acoustic_guitar', label: 'Violão', icon: '🪕' },
  { key: 'bass', label: 'Baixo', icon: '🎻' },
  { key: 'ukulele', label: 'Ukulele', icon: '🌴' },
];

export function ConverterPage() {
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [error, setError] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementInfo | null>(null);
  const [loadingEntitlement, setLoadingEntitlement] = useState(true);
  const [currentStage, setCurrentStage] = useState<ConversionStage | null>(null);
  const [progress, setProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalMeta, setExternalMeta] = useState<any | null>(null);
  const [resolvingUrl, setResolvingUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    authService
      .getEntitlementStatus()
      .then((data) => {
        setEntitlement(data);
      })
      .catch(() => null)
      .finally(() => {
        setLoadingEntitlement(false);
      });
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

  async function processFile(file: File) {
    setError(null);
    setConverting(true);

    try {
      // Validação soberana de Magic Bytes no servidor antes de decodificar
      const sampleChunk = await file.slice(0, 1024 * 32).arrayBuffer();
      const uint8 = new Uint8Array(sampleChunk);
      let binaryStr = '';
      for (let i = 0; i < uint8.length; i++) binaryStr += String.fromCharCode(uint8[i]);
      const base64Data = btoa(binaryStr);

      const valRes = await fetch('/api/media/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dataBase64: base64Data }),
      });
      const val = await valRes.json();
      if (!valRes.ok || !val.isValid) {
        throw new Error(val.error || 'Arquivo de mídia com assinatura binária inválida ou corrompida.');
      }

      const job = await conversionService.startConversion(file, instrument, (stage, p) => {
        setCurrentStage(stage);
        setProgress(p);
      });

      if (job.resultTabId) {
        navigate(`/tab/${job.resultTabId}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar arquivo.');
      authService.getEntitlementStatus().then(setEntitlement).catch(() => null);
    } finally {
      setConverting(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !(converting || (entitlement && !entitlement.isAuthorized))) {
      await processFile(file);
    }
  }

  async function handleVerifiedSampleSubmit(title: string, artist: string) {
    setError(null);
    setConverting(true);

    try {
      const job = await conversionService.startConversion(`${title} — ${artist}`, instrument, (stage, p) => {
        setCurrentStage(stage);
        setProgress(p);
      });

      if (job.resultTabId) {
        navigate(`/tab/${job.resultTabId}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar obra verificada.');
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

  const isUploadDisabled = Boolean(converting || (entitlement && !entitlement.isAuthorized));

  return (
    <div className="page" style={{ maxWidth: 920, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 className="page-title">Converter Música em Tablatura</h1>
        <p className="page-subtitle" style={{ marginBottom: 20 }}>
          Envie seu áudio e nosso motor musical analisa ritmo, BPM, tonalidade, acordes e dedilhados para gerar tablaturas reais.
        </p>
      </header>

      {/* Banner de Entitlement e Acesso */}
      {loadingEntitlement ? (
        <Card elevation={1} style={{ padding: 16, marginBottom: 24 }}>
          <Skeleton height="20px" width="60%" />
        </Card>
      ) : entitlement ? (
        <Card
          elevation={1}
          style={{
            padding: '14px 18px',
            marginBottom: 24,
            background: entitlement.isAuthorized ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${entitlement.isAuthorized ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            {entitlement.accessState === 'FREE_USE_AVAILABLE' && (
              <span>
                <strong style={{ color: 'var(--accent-primary)' }}>Uso Gratuito Disponível</strong>: você pode realizar 1 análise completa sem cadastro.
              </span>
            )}
            {entitlement.accessState === 'FREE_USE_CONSUMED' && (
              <span style={{ color: 'var(--accent-coral)' }}>
                <strong>Cota Gratuita Consumida</strong>: sua degustação gratuita foi utilizada. Cadastre-se para liberar 7 dias de trial Pro completo.
              </span>
            )}
            {entitlement.accessState === 'TRIAL_ACTIVE' && (
              <span style={{ color: 'var(--text-primary)' }}>
                <strong>Trial Pro Ativo</strong>: {entitlement.remainingTrialHours} horas restantes no seu teste gratuito de 7 dias.
              </span>
            )}
            {entitlement.accessState === 'SUBSCRIPTION_ACTIVE' && (
              <span style={{ color: 'var(--text-primary)' }}>
                ✓ <strong>Plano {entitlement.plan.name} Ativo</strong>: análises liberadas no seu plano.
              </span>
            )}
          </div>

          {!entitlement.isAuthorized && (
            <Link to="/register">
              <Button variant="primary" size="sm">
                Ativar 7 Dias Grátis
              </Button>
            </Link>
          )}
        </Card>
      ) : null}

      {/* Seletor de Instrumento */}
      <Card elevation={1} style={{ marginBottom: 24 }}>
        <strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block', marginBottom: 10 }}>
          Instrumento de Destino
        </strong>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {INSTRUMENTS.map((i) => (
            <Button
              key={i.key}
              variant={instrument === i.key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setInstrument(i.key)}
            >
              <span>{i.icon}</span>
              <span>{i.label}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Fontes de Entrada */}
      <div className="card-grid" style={{ marginBottom: 24 }}>
        {/* Dropzone e Upload de Arquivo */}
        <Card
          elevation={1}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed var(--accent-primary)' : '1px dashed var(--border-default)',
            background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface-base)',
            transition: 'all var(--duration-fast) var(--ease-spring)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>Upload de Arquivo de Áudio</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '8px 0 16px', lineHeight: 1.5 }}>
              Arraste e solte ou selecione MP3, WAV, OGG ou MP4 com direitos autorizados de uso. Análise soberana local.
            </p>
          </div>

          <div>
            <label
              style={{
                display: 'inline-block',
                width: '100%',
                padding: '12px',
                textAlign: 'center',
                borderRadius: 'var(--radius-md)',
                background: isUploadDisabled ? 'var(--surface-overlay)' : 'var(--surface-elevated)',
                border: '1px solid var(--border-default)',
                color: isUploadDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: isUploadDisabled ? 'not-allowed' : 'pointer',
                transition: 'all var(--duration-fast) var(--ease-spring)',
              }}
            >
              📁 Selecionar Arquivo do Computador
              <input
                type="file"
                accept="audio/*,video/mp4"
                disabled={isUploadDisabled}
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </Card>

        {/* Demonstração Instantânea */}
        <Card elevation={1} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>Demonstração Instantânea</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '8px 0 16px', lineHeight: 1.5 }}>
              Experimente o pipeline do motor musical gerando uma tablatura de demonstração calibrada em estúdio.
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={isUploadDisabled}
            onClick={handleDemoSubmit}
            style={{ width: '100%' }}
          >
            Gerar Tab de Demonstração
          </Button>
        </Card>

        {/* Importar por Link Externo */}
        <Card elevation={1} style={{ gridColumn: 'span 2' }}>
          <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>Importar por Link (YouTube / Spotify)</strong>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '8px 0 14px', lineHeight: 1.5 }}>
            Valide links públicos para associar metadados oficiais e estruturar a transcrição com conformidade técnica.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... ou https://open.spotify.com/track/..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={resolvingUrl}
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <Button
              variant="secondary"
              disabled={resolvingUrl || !externalUrl.trim()}
              isLoading={resolvingUrl}
              onClick={handleResolveUrl}
            >
              Validar Link
            </Button>
          </div>

          {externalMeta && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                marginTop: 14,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{externalMeta.title}</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>({externalMeta.provider?.toUpperCase()})</span>
                </div>
                {externalMeta.accessMode && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: 'var(--accent-coral)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                    }}
                  >
                    {externalMeta.accessMode}
                  </span>
                )}
              </div>
              {externalMeta.artist && (
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                  Artista: <strong>{externalMeta.artist}</strong> {externalMeta.album ? `| Álbum: ${externalMeta.album}` : ''}
                </div>
              )}
              <div style={{ color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4, fontSize: 12 }}>
                {externalMeta.message}
              </div>
            </div>
          )}
        </Card>

        {/* Catálogo Verificado para Teste Rápido */}
        <Card
          elevation={1}
          style={{
            gridColumn: 'span 2',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>
              Obras Auditadas de Domínio Público (Teste Instantâneo)
            </strong>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gravações históricas & licenças livres auditadas</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Selecione uma obra clássica com direitos verificados para analisar ritmo, acordes e dedilhados sem precisar subir arquivos locais:
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { title: 'Odeon (Tango Brasileiro)', artist: 'Ernesto Nazareth (1912)', badge: 'Domínio Público BR' },
              { title: 'Atraente (Choro Histórico)', artist: 'Chiquinha Gonzaga (1907)', badge: 'Domínio Público BR' },
              { title: 'Sinfonia Nº 5 em Dó menor', artist: 'Beethoven / Musopen', badge: 'CC0 Domínio Público' },
              { title: 'Acoustic Solo Excerpt', artist: 'GuitarSet Dataset', badge: 'CC BY 4.0' },
            ].map((sample) => (
              <button
                key={sample.title}
                disabled={isUploadDisabled}
                onClick={() => handleVerifiedSampleSubmit(sample.title, sample.artist)}
                className="btn secondary"
                style={{
                  fontSize: 12,
                  padding: '8px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: isUploadDisabled ? 'not-allowed' : 'pointer',
                  opacity: isUploadDisabled ? 0.5 : 1,
                }}
              >
                <span>{sample.title}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-overlay)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  {sample.badge}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Visualização de Progresso do Pipeline */}
      {converting && (
        <Card
          elevation={2}
          style={{
            marginBottom: 24,
            borderColor: 'var(--border-focus)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Processando Música...</strong>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-primary)' }}>{progress}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'var(--surface-overlay)',
              borderRadius: 'var(--radius-sm)',
              marginTop: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--accent-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, marginBottom: 0 }}>
            Etapa atual: <strong style={{ color: 'var(--text-primary)' }}>{currentStage}</strong>
          </p>
        </Card>
      )}

      {/* Etapas Arquiteturais do Pipeline */}
      <Card elevation={1}>
        <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Pipeline de Conversão e Teoria Musical</strong>
        <div className="pipeline-steps" style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {CONVERSION_PIPELINE_STEPS.map((s) => (
            <span
              key={s.stage}
              className="pipeline-step"
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                background: currentStage === s.stage ? 'var(--accent-primary)' : 'var(--surface-elevated)',
                color: currentStage === s.stage ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: currentStage === s.stage ? 600 : 500,
                border: currentStage === s.stage ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              }}
            >
              {s.label}
            </span>
          ))}
          <span className="pipeline-step" style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
            Validação Física
          </span>
          <span className="pipeline-step" style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
            OnTabs Play
          </span>
        </div>
      </Card>

      {/* Mensagem de Erro Acionável */}
      {error && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            marginTop: 18,
            color: 'var(--accent-coral)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
