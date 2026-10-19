// src/pages/LoginPage.tsx
// Página de Autenticação do Ontabs

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/authService';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(email, password);
      const redirect = params.get('redirect') || '/library';
      navigate(redirect);
    } catch (err: any) {
      setError(err?.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 400, margin: '40px auto' }}>
      <div className="card">
        <h1 className="page-title" style={{ fontSize: 22, textAlign: 'center' }}>Entrar no OnTabs</h1>
        <p className="page-subtitle" style={{ textAlign: 'center', marginBottom: 20 }}>
          Acesse suas tablaturas, músicas salvas e histórico de treino.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 6,
            padding: 10,
            marginBottom: 16,
            fontSize: 13,
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
              }}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
              }}
              placeholder="Sua senha"
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ marginTop: 10, width: '100%', background: '#10b981', color: '#000', fontWeight: 600 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Ainda não tem conta?{' '}
          <Link to="/register" style={{ color: '#10b981', fontWeight: 500 }}>
            Criar conta (7 dias grátis)
          </Link>
        </div>
      </div>
    </div>
  );
}
