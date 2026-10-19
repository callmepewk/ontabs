// src/pages/RegisterPage.tsx
// Página de Cadastro do Ontabs com ativação de Trial de 7 Dias

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.register(email, password, name);
      navigate('/converter');
    } catch (err: any) {
      setError(err?.message || 'Falha ao registrar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 440, margin: '40px auto' }}>
      <div className="card">
        <h1 className="page-title" style={{ fontSize: 22, textAlign: 'center' }}>Comece Grátis no OnTabs</h1>
        <p className="page-subtitle" style={{ textAlign: 'center', marginBottom: 16 }}>
          Crie sua conta e aproveite <strong>7 dias de Trial Pro completo</strong> sem compromisso.
        </p>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 8,
          padding: 10,
          marginBottom: 16,
          fontSize: 12,
          color: '#10b981',
          lineHeight: 1.5,
        }}>
          ✨ Acesso total ao OnTabs Play, detecção de notas, afinações alternativas e biblioteca estendida liberados no seu período de teste.
        </div>

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

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nome ou Apelido</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
              }}
              placeholder="Seu nome"
            />
          </div>

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
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Senha (mínimo 6 dígitos)</label>
            <input
              type="password"
              required
              minLength={6}
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
              placeholder="Crie sua senha"
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ marginTop: 10, width: '100%', background: '#10b981', color: '#000', fontWeight: 600 }}
          >
            {loading ? 'Criando conta...' : 'Ativar 7 Dias Grátis'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Já possui conta?{' '}
          <Link to="/login" style={{ color: '#10b981', fontWeight: 500 }}>
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}

