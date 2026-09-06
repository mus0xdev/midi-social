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
import { GENRES } from "@/lib/genres";
import type { MidiFile, Profile } from "@/types/database";
function SearchContent() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const tag = params.get("tag") || "";
  const genre = params.get("genre") || "";
  const activeQuery = query || tag || genre;
  const [tracks, setTracks] = useState<MidiFile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [popularGenres, setPopularGenres] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const normalizedQuery = query.toLowerCase();
    const normalizedGenre = (genre || tag).toLowerCase();

    Promise.all([
      supabase.from("midi_files").select("*, profiles(username, avatar_url)").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("*").eq("account_status", "active").order("username", { ascending: true }).limit(100),
    ]).then(([tracksResult, profilesResult]) => {
      const foundTracks = ((tracksResult.data as MidiFile[]) || []).filter((item) => {
        const matchesQuery = !normalizedQuery || [item.title, item.description || "", item.profiles?.username || "", ...(item.tags || [])].some((value) => value.toLowerCase().includes(normalizedQuery));
        const matchesTag = !normalizedGenre || (item.tags || []).some((itemTag) => itemTag.toLowerCase() === normalizedGenre);
        return matchesQuery && matchesTag;
      });
      const genreCounts = new Map<string, number>();
      ((tracksResult.data as MidiFile[]) || []).forEach((item) => (item.tags || []).forEach((itemTag) => {
        const matchedGenre = GENRES.find((itemGenre) => itemGenre.toLowerCase() === itemTag.toLowerCase());
        if (matchedGenre) genreCounts.set(matchedGenre, (genreCounts.get(matchedGenre) || 0) + 1);
      }));
      setPopularGenres(Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count })));
      const foundProfiles = tag || genre ? [] : ((profilesResult.data as Profile[]) || []).filter((profile) => [profile.username, profile.bio || ""].some((value) => value.toLowerCase().includes(normalizedQuery)));
      setTracks(foundTracks);
      setProfiles(foundProfiles);
      setLoading(false);
    });
  }, [activeQuery, query, tag, genre]);

  return <main className="content-shell"><div className="search-heading"><div><p className="eyebrow">SEARCH LIBRARY</p><h1>Find a sound</h1></div><SearchBar defaultValue={query} /></div><section className="genre-filter"><div className="results-section-head"><h2>Genres</h2><span>{GENRES.length} available</span></div><div className="genre-list">{GENRES.map((item) => <Link className={item.toLowerCase() === normalizedGenreForClass(genre || tag) ? "genre-chip active" : "genre-chip"} href={`/search?genre=${encodeURIComponent(item)}`} key={item}>{item}</Link>)}</div></section>{activeQuery && <p className="result-label">Results for <strong>“{query || tag || genre}”</strong></p>}{loading ? <LoadingState /> : <>{popularGenres.length > 0 && !activeQuery && <section className="popular-genres"><div className="results-section-head"><h2>Oblíbené žánry</h2><span>Most used this season</span></div><div className="genre-list">{popularGenres.map(({ name, count }) => <Link className="genre-chip popular" href={`/search?genre=${encodeURIComponent(name)}`} key={name}>{name}<small>{count}</small></Link>)}</div></section>}{profiles.length > 0 && <section className="user-results"><div className="results-section-head"><h2>Creators</h2><span>{profiles.length} found</span></div><div className="user-result-grid">{profiles.map((profile) => <Link className="user-result-card" href={`/user/${encodeURIComponent(profile.username)}`} key={profile.id}><UserAvatar username={profile.username} avatarUrl={profile.avatar_url} size="lg" /><span><strong>@{profile.username}</strong><small>{profile.bio || "Creator on Midylo"}</small></span></Link>)}</div></section>} {tracks.length > 0 ? <section className="track-results"><div className="results-section-head"><h2>MIDI files</h2><span>{tracks.length} found</span></div><div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div></section> : activeQuery && profiles.length === 0 && <EmptyState title="No results found" body="Try a different title, creator or genre." />}</>}</main>;
}
function normalizedGenreForClass(value: string) { return value.toLowerCase(); }
export default function SearchPage() { return <><Navbar /><Suspense fallback={<main className="content-shell"><LoadingState /></main>}><SearchContent /></Suspense></>; }