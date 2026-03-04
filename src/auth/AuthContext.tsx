/**
 * AuthContext
 * React Context provider for authentication state.
 * Works gracefully when Supabase is not configured.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { AuthService, type AuthUser, type AuthSession } from './AuthService';
import { AuthContext } from './authContextDef';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial session
    AuthService.getSession().then((s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    }).catch((err) => {
      console.error('Failed to load initial session:', err);
      setIsLoading(false);
    });

    // Subscribe to future changes
    const unsubscribe = AuthService.onAuthStateChange((u, s) => {
      setUser(u);
      setSession(s);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    await AuthService.signInWithGoogle();
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        isSupabaseConfigured: AuthService.isConfigured(),
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
