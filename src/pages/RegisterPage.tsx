// src/pages/RegisterPage.tsx
// Página de Cadastro do Ontabs com ativação de Trial de 7 Dias

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Button, Card, Input } from '@/components/ui';

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
    <div className="page" style={{ maxWidth: 460, margin: '48px auto' }}>
      <Card elevation={2} style={{ padding: 32 }}>
        <h1 className="page-title" style={{ fontSize: 24, textAlign: 'center', marginBottom: 6 }}>
          Comece Grátis no OnTabs
        </h1>
        <p className="page-subtitle" style={{ textAlign: 'center', marginBottom: 20 }}>
          Crie sua conta e aproveite <strong>7 dias de Trial Pro completo</strong> sem compromisso.
        </p>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--accent-neon)',
            lineHeight: 1.5,
          }}
        >
          ✨ Acesso total ao OnTabs Play, detecção de notas, afinações alternativas e biblioteca estendida liberados no seu período de teste.
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--accent-coral)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Nome ou Apelido"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />

          <Input
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />

          <Input
            label="Senha (mínimo 6 dígitos)"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Crie sua senha"
          />

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            isLoading={loading}
            style={{ marginTop: 8, width: '100%' }}
          >
            {loading ? 'Criando conta...' : 'Ativar 7 Dias Grátis'}
          </Button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          Já possui conta?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Fazer login
          </Link>
        </div>
      </Card>
    </div>
  );
}
