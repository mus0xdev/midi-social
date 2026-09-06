"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Music2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent) { event.preventDefault(); setMessage(""); const normalizedEmail = email.trim().toLowerCase(); if (mode === "signup") { const normalizedUsername = username.trim(); const { data: existingProfile, error: usernameError } = await supabase.from("profiles").select("id").ilike("username", normalizedUsername).maybeSingle(); if (usernameError) { setMessage(usernameError.message); return; } if (existingProfile) { setMessage("An account with this username already exists."); return; } } const result = mode === "login" ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password }) : await supabase.auth.signUp({ email: normalizedEmail, password, options: { data: { username: username.trim() } } }); if (result.error) { const errorMessage = result.error.message.toLowerCase(); setMessage(errorMessage.includes("already") || errorMessage.includes("registered") || errorMessage.includes("duplicate") ? (errorMessage.includes("username") ? "An account with this username already exists." : "An account with this email already exists.") : result.error.message); } else if (mode === "signup" && result.data.user?.identities?.length === 0) setMessage("An account with this email already exists."); else if (mode === "signup") setMessage("Check your email to confirm your account."); else router.push("/"); }
  return <main className="auth-page"><div className="auth-brand"><span className="brand-mark"><Music2 size={18} /></span>Midylo</div><div className="auth-card"><p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN THE COMMUNITY"}</p><h1>{mode === "login" ? "Sign in to Midylo" : "Create your account"}</h1><p className="auth-subtitle">{mode === "login" ? "Your library is waiting." : "Share the source behind your sound."}</p><form onSubmit={submit}>{mode === "signup" && <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={2} maxLength={32} /></label>}<label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></label>{message && <p className="form-error">{message}</p>}<button className="primary-button">{mode === "login" ? "Login" : "Sign up"}</button></form><button className="switch-auth" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}</button></div></main>;
}
