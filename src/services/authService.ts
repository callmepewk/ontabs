// src/services/authService.ts
// MOCK — sem backend de autenticação ainda. Retorna um usuário local fixo
// para permitir que Settings e Library funcionem antes de existir login real.

import { User } from '@/types/domain';

export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  updateSettings(settings: Partial<User['settings']>): Promise<User>;
}

class MockAuthService implements AuthService {
  private user: User = {
    id: 'local-user',
    name: 'Você',
    email: 'local@ontabs.app',
    settings: {
      keyBindings: ['a', 's', 'd', 'f', 'g'],
      audioVolume: 0.8,
      reducedMotion: false,
    },
  };

  async getCurrentUser(): Promise<User | null> {
    return this.user;
  }

  async updateSettings(settings: Partial<User['settings']>): Promise<User> {
    this.user = { ...this.user, settings: { ...this.user.settings, ...settings } };
    return this.user;
  }
}

export const authService: AuthService = new MockAuthService();
