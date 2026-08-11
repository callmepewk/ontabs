// src/stores/appStore.tsx
// Estado global mínimo: usuário/configurações e biblioteca. Estado do Play
// fica isolado dentro de features/play (hooks/useGameEngine.ts) — não é
// misturado aqui de propósito, para não acoplar o motor de jogo ao app shell.

import { createContext, useContext, useMemo, useReducer, ReactNode } from 'react';
import { Song, UserSettings } from '@/types/domain';

interface AppState {
  settings: UserSettings;
  library: Song[];
}

type Action =
  | { type: 'SET_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_LIBRARY'; payload: Song[] }
  | { type: 'UPSERT_SONG'; payload: Song };

const initialState: AppState = {
  settings: {
    keyBindings: ['a', 's', 'd', 'f', 'g'],
    audioVolume: 0.8,
    reducedMotion: false,
  },
  library: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_LIBRARY':
      return { ...state, library: action.payload };
    case 'UPSERT_SONG': {
      const exists = state.library.some((s) => s.id === action.payload.id);
      const library = exists
        ? state.library.map((s) => (s.id === action.payload.id ? action.payload : s))
        : [...state.library, action.payload];
      return { ...state, library };
    }
    default:
      return state;
  }
}

const AppStoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore precisa estar dentro de <AppStoreProvider>');
  return ctx;
}
