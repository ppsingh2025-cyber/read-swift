/**
 * authContextDef
 * Defines the AuthContext type and context object (no React component export).
 * Kept separate from AuthContext.tsx so fast-refresh works correctly.
 */

import { createContext } from 'react';
import type { AuthUser, AuthSession } from './AuthService';

export interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSupabaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isSupabaseConfigured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});
