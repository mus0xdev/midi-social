"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AccountStatus = "active" | "suspended" | "banned";
type AuthContextValue = { user: User | null; loading: boolean; accountStatus: AccountStatus; restricted: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, accountStatus: "active", restricted: false, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("active");

  async function applySession(nextUser: User | null) {
    setUser(nextUser);
    if (!nextUser) { setAccountStatus("active"); return; }
    const { data } = await supabase.from("profiles").select("account_status").eq("id", nextUser.id).single();
    setAccountStatus((data as { account_status?: AccountStatus } | null)?.account_status || "active");
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const nextUser = data.session?.user ?? null;
      await applySession(nextUser);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void applySession(session?.user ?? null); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const restricted = accountStatus !== "active";
  const statusLabel = accountStatus === "banned" ? "Account banned" : "Account suspended";
  const signOut = () => supabase.auth.signOut().then(() => undefined);
  return <AuthContext.Provider value={{ user, loading, accountStatus, restricted, signOut }}><>{restricted ? <main className={`account-blocked ${accountStatus}`}><section className="account-blocked-card"><p className="eyebrow">MIDYLO ACCOUNT</p><h1>{statusLabel}</h1><p>This account cannot access the community while it is {accountStatus}.</p><button className="primary-button" onClick={() => void signOut()} type="button">Sign out</button></section></main> : children}</></AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);