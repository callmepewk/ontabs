// src/server/__tests__/accessStateMachine.test.ts
import { describe, it, expect } from 'vitest';
import {
  authorizeProtectedOperation,
  initializeUserTrial,
  UserAccessRecord,
  TRIAL_DURATION_MS,
} from '../accessStateMachine';

describe('Server Access State Machine & Entitlement Engine', () => {
  it('permite que visitante execute a primeira utilização gratuita', () => {
    const auth = authorizeProtectedOperation(null, false, 'audio_analysis');
    expect(auth.state).toBe('FREE_USE_AVAILABLE');
    expect(auth.isAuthorized).toBe(true);
  });

  it('bloqueia segunda utilização para visitante que já consumiu a cota gratuita', () => {
    const auth = authorizeProtectedOperation(null, true, 'audio_analysis');
    expect(auth.state).toBe('FREE_USE_CONSUMED');
    expect(auth.isAuthorized).toBe(false);
    expect(auth.reason).toContain('Cadastre-se');
  });

  it('inicializa o trial de 7 dias (168 horas) com timestamps UTC precisos', () => {
    const mockNow = new Date('2026-10-19T12:00:00.000Z');
    const trial = initializeUserTrial(() => mockNow);

    expect(trial.trialStartedAt).toBe('2026-10-19T12:00:00.000Z');
    expect(trial.trialEndsAt).toBe('2026-10-26T12:00:00.000Z'); // exatamente 7 dias depois

    const diffMs = new Date(trial.trialEndsAt).getTime() - new Date(trial.trialStartedAt).getTime();
    expect(diffMs).toBe(TRIAL_DURATION_MS);
    expect(diffMs / (1000 * 60 * 60)).toBe(168); // 168 horas
  });

  it('autoriza usuário durante o período de trial ativo', () => {
    const baseTime = new Date('2026-10-19T12:00:00.000Z');
    const trial = initializeUserTrial(() => baseTime);

    const user: UserAccessRecord = {
      id: 'usr_1',
      email: 'pedro@ontabs.app',
      status: 'active',
      trialStartedAt: trial.trialStartedAt,
      trialEndsAt: trial.trialEndsAt,
      trialConsumed: true,
      subscriptionStatus: 'none',
      planCode: trial.planCode,
      analysesThisMonth: 0,
    };

    // 2 dias depois do início
    const currentTime = new Date('2026-10-21T12:00:00.000Z');
    const auth = authorizeProtectedOperation(user, true, 'audio_analysis', () => currentTime);

    expect(auth.state).toBe('TRIAL_ACTIVE');
    expect(auth.isAuthorized).toBe(true);
    expect(auth.remainingTrialHours).toBe(120); // 5 dias restantes = 120 horas
  });

  it('bloqueia usuário imediatamente após 168 horas (expiração no servidor)', () => {
    const baseTime = new Date('2026-10-19T12:00:00.000Z');
    const trial = initializeUserTrial(() => baseTime);

    const user: UserAccessRecord = {
      id: 'usr_1',
      email: 'pedro@ontabs.app',
      status: 'active',
      trialStartedAt: trial.trialStartedAt,
      trialEndsAt: trial.trialEndsAt,
      trialConsumed: true,
      subscriptionStatus: 'none',
      planCode: trial.planCode,
      analysesThisMonth: 0,
    };

    // 7 dias e 1 segundo depois (expirado no servidor)
    const expiredTime = new Date('2026-10-26T12:00:01.000Z');
    const auth = authorizeProtectedOperation(user, true, 'audio_analysis', () => expiredTime);

    expect(auth.state).toBe('TRIAL_EXPIRED');
    expect(auth.isAuthorized).toBe(false);
    expect(auth.reason).toContain('expirou');
  });

  it('alteração do relógio do cliente NÃO afeta a autorização no servidor', () => {
    const baseTime = new Date('2026-10-19T12:00:00.000Z');
    const trial = initializeUserTrial(() => baseTime);

    const user: UserAccessRecord = {
      id: 'usr_1',
      email: 'pedro@ontabs.app',
      status: 'active',
      trialStartedAt: trial.trialStartedAt,
      trialEndsAt: trial.trialEndsAt,
      trialConsumed: true,
      subscriptionStatus: 'none',
      planCode: trial.planCode,
      analysesThisMonth: 0,
    };

    // Mesmo que o navegador envie timestamp falso do passado,
    // o servidor avalia com o seu próprio relógio real
    const serverRealTime = new Date('2026-10-27T00:00:00.000Z');
    const auth = authorizeProtectedOperation(user, true, 'audio_analysis', () => serverRealTime);

    expect(auth.state).toBe('TRIAL_EXPIRED');
    expect(auth.isAuthorized).toBe(false);
  });

  it('bloqueia contas com status suspenso', () => {
    const user: UserAccessRecord = {
      id: 'usr_suspended',
      email: 'bad@actor.com',
      status: 'suspended',
      trialStartedAt: null,
      trialEndsAt: null,
      trialConsumed: false,
      subscriptionStatus: 'active',
      planCode: 'pro',
      analysesThisMonth: 0,
    };

    const auth = authorizeProtectedOperation(user, false, 'audio_analysis');
    expect(auth.state).toBe('ACCOUNT_SUSPENDED');
    expect(auth.isAuthorized).toBe(false);
  });

  it('autoriza usuário com assinatura Pro ativa respeitando limites mensais', () => {
    const user: UserAccessRecord = {
      id: 'usr_pro',
      email: 'pro@ontabs.app',
      status: 'active',
      trialStartedAt: '2026-01-01T00:00:00.000Z',
      trialEndsAt: '2026-01-08T00:00:00.000Z',
      trialConsumed: true,
      subscriptionStatus: 'active',
      planCode: 'pro',
      analysesThisMonth: 10, // limite é 60
    };

    const auth = authorizeProtectedOperation(user, true, 'audio_analysis');
    expect(auth.state).toBe('SUBSCRIPTION_ACTIVE');
    expect(auth.isAuthorized).toBe(true);

    // Quando atinge o limite do plano Pro
    const userMaxed = { ...user, analysesThisMonth: 60 };
    const authMaxed = authorizeProtectedOperation(userMaxed, true, 'audio_analysis');
    expect(authMaxed.state).toBe('SUBSCRIPTION_ACTIVE');
    expect(authMaxed.isAuthorized).toBe(false);
    expect(authMaxed.reason).toContain('limite mensal');
  });
});
