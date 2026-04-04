'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type CustomerProfile = Database['public']['Tables']['customer_profiles']['Row'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  profile: CustomerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }) => Promise<{ error?: string; requiresEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  sendOTP: (phone: string) => Promise<{ error?: string }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error?: string }>;
  sendMagicLink: (email: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Note: createClient() returns a singleton in the browser
  const supabase = createClient();

  // ── Fetch customer profile row ──────────────────────────────────────────────
  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile((data as CustomerProfile) ?? null);
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // ── Initialise session + listen for changes ─────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: 'Invalid email or password.' };
      }

      setUser(data.user);
      if (data.user) {
        await fetchProfile(data.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);

      return {};
    },
    [fetchProfile, supabase]
  );

  const signUp = useCallback(
    async (data: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
    }): Promise<{ error?: string; requiresEmailVerification?: boolean }> => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'Registration failed.' };
      return { requiresEmailVerification: json.requires_email_verification };
    },
    []
  );

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const sendOTP = useCallback(
    async (phone: string): Promise<{ error?: string }> => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'otp_request', phone }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'Failed to send OTP.' };
      return {};
    },
    []
  );

  const verifyOTP = useCallback(
    async (phone: string, token: string): Promise<{ error?: string }> => {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'OTP verification failed.' };

      // Re-fetch session after OTP verification
      await supabase.auth.getSession();
      return {};
    },
    [supabase]
  );

  const sendMagicLink = useCallback(
    async (email: string): Promise<{ error?: string }> => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'magic_link', email }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'Failed to send magic link.' };
      return {};
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        sendOTP,
        verifyOTP,
        sendMagicLink,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
