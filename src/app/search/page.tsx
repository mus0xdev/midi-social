"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { UserAvatar } from "@/components/UserAvatar";
import { supabase } from "@/lib/supabase";
import type { MidiFile, Profile } from "@/types/database";
function SearchContent() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const tag = params.get("tag") || "";
  const activeQuery = query || tag;
  const [tracks, setTracks] = useState<MidiFile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(Boolean(activeQuery));

  useEffect(() => {
    if (!activeQuery) return;

    const normalizedQuery = query.toLowerCase();
    const normalizedTag = tag.toLowerCase();

    Promise.all([
      supabase.from("midi_files").select("*, profiles(username, avatar_url)").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("*").order("username", { ascending: true }).limit(100),
    ]).then(([tracksResult, profilesResult]) => {
      const foundTracks = ((tracksResult.data as MidiFile[]) || []).filter((item) => {
        const matchesQuery = !normalizedQuery || [item.title, item.description || "", item.profiles?.username || "", ...(item.tags || [])].some((value) => value.toLowerCase().includes(normalizedQuery));
        const matchesTag = !normalizedTag || (item.tags || []).some((itemTag) => itemTag.toLowerCase() === normalizedTag);
        return matchesQuery && matchesTag;
      });
      const foundProfiles = tag ? [] : ((profilesResult.data as Profile[]) || []).filter((profile) => [profile.username, profile.bio || ""].some((value) => value.toLowerCase().includes(normalizedQuery)));
      setTracks(foundTracks);
      setProfiles(foundProfiles);
      setLoading(false);
    });
  }, [activeQuery, query, tag]);

  return <main className="content-shell"><div className="search-heading"><div><p className="eyebrow">SEARCH LIBRARY</p><h1>Find a sound</h1></div><SearchBar defaultValue={query} /></div>{activeQuery && <p className="result-label">Results for <strong>“{query || tag}”</strong></p>}{loading ? <LoadingState /> : <>{profiles.length > 0 && <section className="user-results"><div className="results-section-head"><h2>Creators</h2><span>{profiles.length} found</span></div><div className="user-result-grid">{profiles.map((profile) => <Link className="user-result-card" href={`/user/${encodeURIComponent(profile.username)}`} key={profile.id}><UserAvatar username={profile.username} avatarUrl={profile.avatar_url} size="lg" /><span><strong>@{profile.username}</strong><small>{profile.bio || "Creator on Midylo"}</small></span></Link>)}</div></section>} {tracks.length > 0 ? <section className="track-results"><div className="results-section-head"><h2>MIDI files</h2><span>{tracks.length} found</span></div><div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div></section> : profiles.length === 0 && <EmptyState title="No results found" body="Try a different title, creator or tag." />}</>}</main>;
}
export default function SearchPage() { return <><Navbar /><Suspense fallback={<main className="content-shell"><LoadingState /></main>}><SearchContent /></Suspense></>; }