import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  supabase,
  isSupabaseConfigured,
  getUserRole,
  getUserProfile,
  UserRole,
  UserProfile,
} from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    let active = true;
    let revision = 0;
    const applySession = (nextSession: Session | null) => {
      const request = ++revision;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setUserRole(null);
      setUserProfile(null);
      setIsLoading(Boolean(nextSession?.user));
      if (!nextSession?.user) return;

      // Run outside the auth callback, and discard results for older sessions.
      setTimeout(async () => {
        if (!active || request !== revision) return;
        try {
          const [role, profile] = await Promise.all([
            getUserRole(nextSession.user.id),
            getUserProfile(nextSession.user.id),
          ]);
          if (!active || request !== revision) return;
          setUserRole(role);
          setUserProfile(profile);
        } catch {
          if (!active || request !== revision) return;
          setUserRole(null);
          setUserProfile(null);
        } finally {
          if (active && request === revision) setIsLoading(false);
        }
      }, 0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) applySession(nextSession);
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && revision === 0) applySession(error ? null : data.session);
      })
      .catch(() => {
        if (active && revision === 0) applySession(null);
      });
    return () => {
      active = false;
      ++revision;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        userProfile,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
