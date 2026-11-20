import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<{ error?: string; oauthUrl?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractProfileFromUser(authUser: User): UserProfile {
  const meta = (authUser.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (authUser.app_metadata || {}) as Record<string, unknown>;
  return {
    id: authUser.id,
    email: authUser.email ?? null,
    full_name:
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      null,
    avatar_url:
      (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
      (typeof meta.picture === 'string' && meta.picture) ||
      null,
    provider:
      (typeof appMeta.provider === 'string' && appMeta.provider) || 'google',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserToDatabase = useCallback(async (authUser: User) => {
    const derived = extractProfileFromUser(authUser);
    setProfile((prev) => prev ?? derived);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            id: derived.id,
            email: derived.email,
            full_name: derived.full_name,
            avatar_url: derived.avatar_url,
            provider: derived.provider,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('id, email, full_name, avatar_url, provider, created_at, updated_at')
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.warn('Failed to sync user profile to public.users:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await syncUserToDatabase(currentUser);
      } else {
        setProfile(null);
      }
    } catch {
      // Ignore if Supabase env is unavailable
    }
  }, [syncUserToDatabase]);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        const supabase = createClient();

        // Handle OAuth PKCE code in URL if present
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            url.searchParams.delete('code');
            const cleanUrl =
              url.pathname + (url.search ? url.search : '') + url.hash;
            window.history.replaceState({}, document.title, cleanUrl);
          } else if (window.location.hash.includes('access_token=')) {
            // Let Supabase process hash tokens then clean URL hash
            await supabase.auth.getSession();
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + window.location.search
            );
          }
        }

        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(initialSession);
        const initialUser = initialSession?.user ?? null;
        setUser(initialUser);

        if (initialUser) {
          await syncUserToDatabase(initialUser);
        } else {
          setProfile(null);
        }

        const { data } = supabase.auth.onAuthStateChange(
          async (_event, nextSession) => {
            if (!mounted) return;
            setSession(nextSession);
            const nextUser = nextSession?.user ?? null;
            setUser(nextUser);

            if (nextUser) {
              await syncUserToDatabase(nextUser);
            } else {
              setProfile(null);
            }
          }
        );

        subscription = data.subscription;
      } catch (err) {
        console.warn('Supabase Auth initialization skipped:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Sync session when returning to tab (e.g., after OAuth in new tab)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshProfile();
      }
    };
    window.addEventListener('focus', refreshProfile);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('focus', refreshProfile);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [refreshProfile, syncUserToDatabase]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;

      let inIframe = false;
      try {
        inIframe = window.self !== window.top;
      } catch {
        inIframe = true;
      }

      if (inIframe) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });
        if (error) {
          return { error: error.message };
        }
        return { oauthUrl: data?.url };
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Google 로그인 시작 중 오류가 발생했습니다.',
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      session,
      isAuthenticated: Boolean(user),
      isLoading,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      session,
      isLoading,
      signInWithGoogle,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
