// src/services/authService.ts
// Serviço de Autenticação e Entitlement do Ontabs
// Comunicação soberana com backend local (/api/auth e /api/entitlement).

import { User } from '@/types/domain';

const TOKEN_KEY = 'ontabs_session_token';
const VISITOR_KEY = 'ontabs_visitor_id';

export interface EntitlementInfo {
  accessState: string;
  isAuthorized: boolean;
  remainingTrialHours: number;
  reason: string | null;
  plan: {
    code: string;
    name: string;
    priceMonthly: number;
    analysesPerMonth: number;
    maxSongs: number;
    features: string[];
  };
}

export interface AuthService {
  getToken(): string | null;
  getVisitorId(): string;
  getCurrentUser(): Promise<User | null>;
  login(email: string, password: string): Promise<User>;
  register(email: string, password: string, name?: string): Promise<User>;
  logout(): Promise<void>;
  updateSettings(settings: Partial<User['settings']>): Promise<User>;
  getEntitlementStatus(): Promise<EntitlementInfo>;
}

class SovereignAuthService implements AuthService {
  private cachedUser: User | null = null;

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private setToken(token: string | null): void {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      void err;
    }
  }

  getVisitorId(): string {
    try {
      let id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch {
      return 'visitor_session';
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.setToken(null);
        return null;
      }
      const data = await res.json();
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        settings: {
          keyBindings: ['a', 's', 'd', 'f', 'g'],
          audioVolume: 0.8,
          reducedMotion: false,
        },
      };
      this.cachedUser = user;
      return user;
    } catch {
      return this.cachedUser;
    }
  }

  async login(email: string, password: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao efetuar login.');
    }

    const data = await res.json();
    this.setToken(data.token);
    const user: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      settings: {
        keyBindings: ['a', 's', 'd', 'f', 'g'],
        audioVolume: 0.8,
        reducedMotion: false,
      },
    };
    this.cachedUser = user;
    return user;
  }

  async register(email: string, password: string, name?: string): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao criar conta.');
    }

    const data = await res.json();
    this.setToken(data.token);
    const user: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      settings: {
        keyBindings: ['a', 's', 'd', 'f', 'g'],
        audioVolume: 0.8,
        reducedMotion: false,
      },
    };
    this.cachedUser = user;
    return user;
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        void err;
      }
    }
    this.setToken(null);
    this.cachedUser = null;
  }

  async updateSettings(settings: Partial<User['settings']>): Promise<User> {
    const user = (await this.getCurrentUser()) || {
      id: 'local_user',
      name: 'Você',
      email: 'local@ontabs.app',
      settings: {
        keyBindings: ['a', 's', 'd', 'f', 'g'],
        audioVolume: 0.8,
        reducedMotion: false,
      },
    };
    user.settings = { ...user.settings, ...settings };
    this.cachedUser = user;
    return user;
  }

  async getEntitlementStatus(): Promise<EntitlementInfo> {
    const token = this.getToken();
    const visitorId = this.getVisitorId();
    const headers: Record<string, string> = { 'X-Visitor-Id': visitorId };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/entitlement/status', { headers });
    if (!res.ok) {
      throw new Error('Falha ao consultar estado de entitlement.');
    }
    return await res.json();
  }
}

export const authService: AuthService = new SovereignAuthService();
