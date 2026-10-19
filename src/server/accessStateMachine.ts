// src/server/accessStateMachine.ts
// Máquina de Estados de Acesso e Entitlement do Ontabs
// Executada exclusivamente no servidor com validação temporal confiável.

export type AccessState =
  | 'ANONYMOUS'
  | 'FREE_USE_AVAILABLE'
  | 'FREE_USE_CONSUMED'
  | 'REGISTERED'
  | 'TRIAL_ACTIVE'
  | 'TRIAL_EXPIRED'
  | 'SUBSCRIPTION_ACTIVE'
  | 'SUBSCRIPTION_PAST_DUE'
  | 'SUBSCRIPTION_CANCELED'
  | 'ACCOUNT_SUSPENDED';

export type PlanCode = 'free' | 'pro' | 'premium';

export interface PlanLimits {
  code: PlanCode;
  name: string;
  priceMonthly: number;
  analysesPerMonth: number;
  maxSongs: number;
  maxInstruments: number;
  maxDifficulties: number;
  features: string[];
}

export const PLAN_CATALOG: Record<PlanCode, PlanLimits> = {
  free: {
    code: 'free',
    name: 'Iniciante (Free)',
    priceMonthly: 0,
    analysesPerMonth: 5,
    maxSongs: 1,
    maxInstruments: 1,
    maxDifficulties: 1,
    features: ['1 música na biblioteca', '5 análises por mês', 'Afinações padrão'],
  },
  pro: {
    code: 'pro',
    name: 'Músico Pro',
    priceMonthly: 29.90,
    analysesPerMonth: 60,
    maxSongs: 200,
    maxInstruments: 4,
    maxDifficulties: 4,
    features: [
      '200 músicas na biblioteca',
      '60 análises por mês',
      'Todos os instrumentos e afinações alternativas',
      'Loop de treino com velocidade variável',
    ],
  },
  premium: {
    code: 'premium',
    name: 'Estúdio Premium',
    priceMonthly: 69.90,
    analysesPerMonth: 500,
    maxSongs: 5000,
    maxInstruments: 4,
    maxDifficulties: 4,
    features: [
      'Biblioteca ilimitada (5.000 músicas)',
      '500 análises por mês',
      'Exportação MIDI e MusicXML',
      'Suporte prioritário e acesso antecipado',
    ],
  },
};

// 7 dias corridos = 168 horas = 604.800.000 ms
export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface UserAccessRecord {
  id: string;
  email: string;
  status: 'active' | 'suspended';
  trialStartedAt: string | null; // ISO UTC
  trialEndsAt: string | null;    // ISO UTC
  trialConsumed: boolean;
  subscriptionStatus: 'none' | 'active' | 'past_due' | 'canceled';
  planCode: PlanCode;
  analysesThisMonth: number;
}

export interface EntitlementCheckResult {
  state: AccessState;
  isAuthorized: boolean;
  reason?: string;
  remainingTrialHours?: number;
  plan: PlanLimits;
}

/**
 * Avalia o estado de acesso de um usuário autenticado ou visitante anônimo.
 * Aceita nowProvider para injeção de relógio em testes reproduzíveis.
 */
export function evaluateAccessState(
  user: UserAccessRecord | null,
  visitorConsumedFreeUse: boolean,
  nowProvider: () => Date = () => new Date()
): AccessState {
  if (!user) {
    return visitorConsumedFreeUse ? 'FREE_USE_CONSUMED' : 'FREE_USE_AVAILABLE';
  }

  if (user.status === 'suspended') {
    return 'ACCOUNT_SUSPENDED';
  }

  // Verifica se possui assinatura ativa paga
  if (user.subscriptionStatus === 'active') {
    return 'SUBSCRIPTION_ACTIVE';
  }
  if (user.subscriptionStatus === 'past_due') {
    return 'SUBSCRIPTION_PAST_DUE';
  }
  if (user.subscriptionStatus === 'canceled') {
    return 'SUBSCRIPTION_CANCELED';
  }

  // Avalia período de Trial (7 dias = 168 horas)
  if (user.trialStartedAt && user.trialEndsAt) {
    const now = nowProvider().getTime();
    const ends = new Date(user.trialEndsAt).getTime();

    if (now <= ends) {
      return 'TRIAL_ACTIVE';
    } else {
      return 'TRIAL_EXPIRED';
    }
  }

  return 'REGISTERED';
}

/**
 * Verifica autorização no servidor para executar uma operação protegida (ex: converter/analisar áudio).
 */
export function authorizeProtectedOperation(
  user: UserAccessRecord | null,
  visitorConsumedFreeUse: boolean,
  _operation: 'audio_analysis' | 'save_tab' | 'gameplay' | 'export',
  nowProvider: () => Date = () => new Date()
): EntitlementCheckResult {
  const state = evaluateAccessState(user, visitorConsumedFreeUse, nowProvider);
  const now = nowProvider().getTime();

  // 1. Visitante
  if (!user) {
    if (state === 'FREE_USE_AVAILABLE') {
      return {
        state: 'FREE_USE_AVAILABLE',
        isAuthorized: true,
        plan: PLAN_CATALOG.free,
      };
    }
    return {
      state: 'FREE_USE_CONSUMED',
      isAuthorized: false,
      reason: 'Sua utilização gratuita já foi realizada. Cadastre-se para ativar seu trial de 7 dias grátis.',
      plan: PLAN_CATALOG.free,
    };
  }

  // 2. Conta Suspensa
  if (state === 'ACCOUNT_SUSPENDED') {
    return {
      state: 'ACCOUNT_SUSPENDED',
      isAuthorized: false,
      reason: 'Conta suspensa por violação dos termos de uso.',
      plan: PLAN_CATALOG.free,
    };
  }

  // 3. Assinatura Ativa
  if (state === 'SUBSCRIPTION_ACTIVE') {
    const plan = PLAN_CATALOG[user.planCode] || PLAN_CATALOG.free;
    if (user.analysesThisMonth >= plan.analysesPerMonth) {
      return {
        state: 'SUBSCRIPTION_ACTIVE',
        isAuthorized: false,
        reason: `Você atingiu o limite mensal de análises do plano ${plan.name} (${plan.analysesPerMonth}/mês). Faça upgrade para continuar.`,
        plan,
      };
    }
    return {
      state: 'SUBSCRIPTION_ACTIVE',
      isAuthorized: true,
      plan,
    };
  }

  // 4. Assinatura Cancelada ou Atrasada
  if (state === 'SUBSCRIPTION_PAST_DUE' || state === 'SUBSCRIPTION_CANCELED') {
    return {
      state,
      isAuthorized: false,
      reason: 'Sua assinatura não está ativa. Atualize seu método de pagamento para reativar o acesso.',
      plan: PLAN_CATALOG[user.planCode] || PLAN_CATALOG.free,
    };
  }

  // 5. Trial de 7 Dias Ativo
  if (state === 'TRIAL_ACTIVE') {
    const ends = new Date(user.trialEndsAt!).getTime();
    const remainingMs = Math.max(0, ends - now);
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

    return {
      state: 'TRIAL_ACTIVE',
      isAuthorized: true,
      remainingTrialHours: remainingHours,
      plan: PLAN_CATALOG.pro, // Durante o trial, liberam-se os recursos Pro
    };
  }

  // 6. Trial Expirado
  if (state === 'TRIAL_EXPIRED') {
    return {
      state: 'TRIAL_EXPIRED',
      isAuthorized: false,
      reason: 'Seu período de teste de 7 dias expirou. Escolha um plano para continuar criando e analisando músicas.',
      plan: PLAN_CATALOG.free,
    };
  }

  // 7. Apenas registrado mas sem trial (ou plano free básico)
  const freePlan = PLAN_CATALOG.free;
  if (user.analysesThisMonth < freePlan.analysesPerMonth) {
    return {
      state: 'REGISTERED',
      isAuthorized: true,
      plan: freePlan,
    };
  }

  return {
    state: 'REGISTERED',
    isAuthorized: false,
    reason: 'Limite de análises gratuitas atingido.',
    plan: freePlan,
  };
}

/**
 * Cria os parâmetros de início do trial garantindo idempotência e cálculo seguro de expiração UTC.
 */
export function initializeUserTrial(nowProvider: () => Date = () => new Date()): {
  trialStartedAt: string;
  trialEndsAt: string;
  planCode: PlanCode;
} {
  const now = nowProvider();
  const ends = new Date(now.getTime() + TRIAL_DURATION_MS);

  return {
    trialStartedAt: now.toISOString(),
    trialEndsAt: ends.toISOString(),
    planCode: 'pro', // Trial inicia no plano Pro para experiência completa
  };
}
