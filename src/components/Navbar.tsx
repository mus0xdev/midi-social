"use client";

import Link from "next/link";
import { LogIn, LogOut, Music2, Upload } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";

export function Navbar() {
  const { user, signOut } = useAuth();
  const username = user?.user_metadata.username || user?.email?.split("@")[0] || "account";
  return <header className="site-header"><Link className="brand" href="/"><span className="brand-mark"><Music2 size={18} suppressHydrationWarning /></span>Midylo</Link><nav><Link href="/new">Explore</Link><Link href="/new">Newest</Link></nav><div className="header-actions">{user ? <><Link className="upload-button" href="/upload"><Upload size={16} suppressHydrationWarning /> Upload MIDI</Link><Link href={`/user/${encodeURIComponent(username)}`}><UserAvatar username={username} /></Link><button className="icon-button" title="Sign out" onClick={() => void signOut()}><LogOut size={17} suppressHydrationWarning /></button></> : <Link className="login-button" href="/auth"><LogIn size={16} suppressHydrationWarning /> Login</Link>}</div></header>;
}