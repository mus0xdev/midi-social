"use client";

import Link from "next/link";
import { LogIn, LogOut, Music2, Settings, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";
import { supabase } from "@/lib/supabase";

export function Navbar() {
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const username = user?.user_metadata.username || user?.email?.split("@")[0] || "account";
  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from("profiles").select("avatar_url").eq("id", user.id).single().then(({ data }) => setAvatarUrl((data as { avatar_url?: string | null } | null)?.avatar_url || null));
  }, [user]);
  return <header className="site-header"><Link className="brand" href="/"><span className="brand-mark"><Music2 size={18} suppressHydrationWarning /></span>Midylo</Link><nav><Link href="/explore">Explore</Link><Link href="/new">Newest</Link>{user && <Link href="/favorites">Favorites</Link>}</nav><div className="header-actions">{user ? <><Link className="upload-button" href="/upload"><Upload size={16} suppressHydrationWarning /> Upload MIDI</Link><Link href="/settings" title="Settings"><Settings size={17} /></Link><Link href={`/user/${encodeURIComponent(username)}`}><UserAvatar username={username} avatarUrl={avatarUrl} /></Link><button className="icon-button" title="Sign out" onClick={() => void signOut()}><LogOut size={17} suppressHydrationWarning /></button></> : <Link className="login-button" href="/auth"><LogIn size={16} suppressHydrationWarning /> Login</Link>}</div></header>;
}