"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = { user: User | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const nextUser = data.session?.user ?? null;
      if (nextUser) {
        const { data: profile } = await supabase.from("profiles").select("account_status").eq("id", nextUser.id).single();
        if (profile?.account_status && profile.account_status !== "active") await supabase.auth.signOut();
        else setUser(nextUser);
      }
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading, signOut: () => supabase.auth.signOut().then(() => undefined) }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);