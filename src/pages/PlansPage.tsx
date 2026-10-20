// src/pages/PlansPage.tsx
// Página de Planos e Assinaturas do Ontabs

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authService, EntitlementInfo } from '@/services/authService';
import { Button, Card, Skeleton } from '@/components/ui';

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

  const currentPlanCode = entitlement?.plan?.code || 'free';

  return (
    <div className="page" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <Link
          to="/"
          style={{
            color: 'var(--text-secondary)',
            fontSize: 13,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          ← Voltar para o início
        </Link>
        <h1 className="page-title">Planos e Assinaturas</h1>
        <p className="page-subtitle" style={{ marginBottom: 16 }}>
          O OnTabs é utilizável gratuitamente. Os planos Pro e Premium ampliam os recursos, cotas e ferramentas de estudo.
        </p>

        {entitlement?.accessState === 'TRIAL_ACTIVE' && (
          <Card
            elevation={1}
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
              padding: '14px 18px',
              fontSize: 14,
              color: 'var(--text-primary)',
            }}
          >
            <strong>Trial Pro Ativo</strong> — Restam aproximadamente {entitlement.remainingTrialHours} horas no seu período de degustação de 7 dias.
          </Card>
        )}

        {selectedMsg && (
          <Card
            elevation={1}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '14px 18px',
              marginTop: 12,
              fontSize: 14,
              color: 'var(--text-primary)',
            }}
          >
            {selectedMsg}
          </Card>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[1, 2, 3].map((n) => (
            <Card key={n} elevation={1} style={{ padding: 28, height: 380 }}>
              <Skeleton width="40%" height="24px" style={{ marginBottom: 16 }} />
              <Skeleton width="60%" height="36px" style={{ marginBottom: 20 }} />
              <Skeleton width="100%" height="16px" style={{ marginBottom: 10 }} />
              <Skeleton width="90%" height="16px" style={{ marginBottom: 10 }} />
              <Skeleton width="75%" height="16px" style={{ marginBottom: 30 }} />
              <Skeleton width="100%" height="42px" radius="var(--radius-md)" />
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {plans.map((p) => {
            const isCurrent = currentPlanCode === p.code;
            const isPro = p.code === 'pro';

            return (
              <Card
                key={p.code}
                elevation={isPro ? 2 : 1}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 28,
                  border: isPro ? '1px solid var(--accent-primary)' : undefined,
                  boxShadow: isPro ? 'var(--shadow-md)' : undefined,
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</h3>
                    {isPro && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: 'var(--accent-subtle)',
                          color: 'var(--accent-primary)',
                          border: '1px solid var(--accent-primary)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        MAIS POPULAR
                      </span>
                    )}
                  </div>

                  <div style={{ margin: '16px 0', fontSize: 30, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {p.priceMonthly === 0 ? 'Grátis' : `R$ ${p.priceMonthly.toFixed(2)}`}
                    {p.priceMonthly > 0 && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}> / mês</span>
                    )}
                  </div>

                  <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                    {p.features.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                    <li>{p.analysesPerMonth} análises por mês</li>
                    <li>Até {p.maxSongs} músicas salvas</li>
                  </ul>
                </div>

                <div style={{ marginTop: 28 }}>
                  <Button
                    variant={isCurrent ? 'secondary' : isPro ? 'primary' : 'secondary'}
                    disabled={isCurrent}
                    onClick={() => handleSelectPlan(p.code)}
                    style={{ width: '100%' }}
                  >
                    {isCurrent ? 'Plano Atual' : p.priceMonthly === 0 ? 'Ficar no Free' : 'Escolher Plano'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 40, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        Cobrança segura online (Stripe/Pix) pronta para homologação. Os planos já operam nativamente por controle de entitlements no servidor.
      </div>
    </div>
  );
}
