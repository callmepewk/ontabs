// src/pages/PlansPage.tsx
// Página de Planos e Assinaturas do Ontabs

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authService, EntitlementInfo } from '@/services/authService';

interface PlanItem {
  code: string;
  name: string;
  priceMonthly: number;
  analysesPerMonth: number;
  maxSongs: number;
  features: string[];
}

export function PlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [entitlement, setEntitlement] = useState<EntitlementInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, entRes] = await Promise.all([
          fetch('/api/plans').then((r) => r.json()),
          authService.getEntitlementStatus().catch(() => null),
        ]);
        setPlans(plansRes.plans || []);
        setEntitlement(entRes);
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectPlan = async (planCode: string) => {
    setSelectedMsg(null);
    const token = authService.getToken();
    if (!token) {
      window.location.href = '/login?redirect=/planos';
      return;
    }

    try {
      const res = await fetch('/api/plans/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedMsg(`Plano atualizado com sucesso!`);
      const updatedEnt = await authService.getEntitlementStatus();
      setEntitlement(updatedEnt);
    } catch (err: any) {
      setSelectedMsg(err?.message || 'Erro ao selecionar plano.');
    }
  };

  if (loading) {
    return <div className="page"><p>Carregando planos...</p></div>;
  }

  const currentPlanCode = entitlement?.plan?.code || 'free';

  return (
    <div className="page" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Voltar para o início</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>Planos e Assinaturas</h1>
        <p className="page-subtitle">
          O OnTabs é utilizável gratuitamente. Os planos Pro e Premium ampliam os recursos, cotas e ferramentas de estudo.
        </p>

        {entitlement?.accessState === 'TRIAL_ACTIVE' && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
            fontSize: 14,
            color: '#10b981',
          }}>
            🌟 <strong>Trial Pro Ativo</strong> — Restam aproximadamente {entitlement.remainingTrialHours} horas no seu período de degustação de 7 dias.
          </div>
        )}

        {selectedMsg && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
            fontSize: 14,
          }}>
            {selectedMsg}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {plans.map((p) => {
          const isCurrent = currentPlanCode === p.code;
          const isPro = p.code === 'pro';

          return (
            <div
              key={p.code}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: isPro ? 'rgba(16, 185, 129, 0.5)' : undefined,
                boxShadow: isPro ? '0 0 15px rgba(16, 185, 129, 0.15)' : undefined,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{p.name}</h3>
                  {isPro && (
                    <span style={{ fontSize: 11, background: '#10b981', color: '#000', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                      Mais Popular
                    </span>
                  )}
                </div>

                <div style={{ margin: '16px 0', fontSize: 28, fontWeight: 700 }}>
                  {p.priceMonthly === 0 ? 'Grátis' : `R$ ${p.priceMonthly.toFixed(2)}`}
                  {p.priceMonthly > 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}> / mês</span>}
                </div>

                <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  {p.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                  <li>{p.analysesPerMonth} análises por mês</li>
                  <li>Até {p.maxSongs} músicas salvas</li>
                </ul>
              </div>

              <div style={{ marginTop: 24 }}>
                <button
                  className="btn"
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(p.code)}
                  style={{
                    width: '100%',
                    background: isCurrent ? 'var(--bg-elevated)' : isPro ? '#10b981' : undefined,
                    color: isPro && !isCurrent ? '#000' : undefined,
                    fontWeight: 600,
                  }}
                >
                  {isCurrent ? 'Plano Atual' : p.priceMonthly === 0 ? 'Ficar no Free' : 'Escolher Plano'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Cobrança segura online (Stripe/Pix) pronta para homologação. Os planos já operam nativamente por controle de entitlements no servidor.
      </div>
    </div>
  );
}
