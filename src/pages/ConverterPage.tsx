// src/pages/ConverterPage.tsx
import { useState } from 'react';
import { CONVERSION_PIPELINE_STEPS, conversionService } from '@/services/conversionService';
import { musicService } from '@/services/musicService';
import { Instrument } from '@/types/domain';

const INSTRUMENTS: { key: Instrument; label: string }[] = [
  { key: 'guitar', label: 'Guitarra' },
  { key: 'acoustic_guitar', label: 'Violão' },
  { key: 'bass', label: 'Baixo' },
];

export function ConverterPage() {
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const song = await musicService.uploadAudioFile(file);
    try {
      await conversionService.startConversion(song.id, instrument);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleYoutubeSubmit() {
    if (!youtubeUrl) return;
    setError(null);
    try {
      await musicService.submitYoutubeUrl(youtubeUrl);
      await conversionService.startConversion('pending', instrument);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Converter</h1>
      <p className="page-subtitle">Transforme uma música em tablatura. O motor de conversão ainda está em desenvolvimento — a interface abaixo já reflete o pipeline real que será usado.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <strong>Instrumento</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {INSTRUMENTS.map((i) => (
            <button
              key={i.key}
              className={`btn ${instrument === i.key ? '' : 'secondary'}`}
              onClick={() => setInstrument(i.key)}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <strong>Upload de arquivo</strong>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '8px 0' }}>MP3, MP4 e outros formatos compatíveis.</p>
          <input type="file" accept="audio/*,video/mp4" onChange={handleUpload} />
        </div>
        <div className="card">
          <strong>YouTube</strong>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '8px 0' }}>Cole o link de um vídeo para o qual você tem autorização de uso.</p>
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', marginBottom: 8 }}
          />
          <button className="btn secondary" onClick={handleYoutubeSubmit}>Enviar</button>
        </div>
        <div className="card">
          <strong>Spotify</strong>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '8px 0' }}>Integração via Spotify Web API — preparada, ainda não conectada.</p>
          <button className="btn secondary" disabled>Conectar (em breve)</button>
        </div>
      </div>

      <div className="card">
        <strong>Pipeline de conversão</strong>
        <div className="pipeline-steps">
          {CONVERSION_PIPELINE_STEPS.map((s) => (
            <span key={s.stage} className="pipeline-step">{s.label}</span>
          ))}
          <span className="pipeline-step">Edição</span>
          <span className="pipeline-step">OnTabs Play</span>
        </div>
      </div>

      {error && (
        <p style={{ color: '#ff5e6c', fontSize: 13, marginTop: 16 }}>{error}</p>
      )}
    </div>
  );
}
