"use client";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import type { MidiFile } from "@/types/database";
function SearchContent() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const tag = params.get("tag") || "";
  const activeQuery = query || tag;
  const [tracks, setTracks] = useState<MidiFile[]>([]);
  const [loading, setLoading] = useState(Boolean(activeQuery));

  useEffect(() => {
    if (!activeQuery) return;

    const normalizedQuery = query.toLowerCase();
    const normalizedTag = tag.toLowerCase();

    supabase.from("midi_files").select("*, profiles(username, avatar_url)").order("created_at", { ascending: false }).limit(100).then(({ data }) => {
      const found = ((data as MidiFile[]) || []).filter((item) => {
        const matchesQuery = !normalizedQuery || [item.title, item.description || "", item.profiles?.username || "", ...(item.tags || [])].some((value) => value.toLowerCase().includes(normalizedQuery));
        const matchesTag = !normalizedTag || (item.tags || []).some((itemTag) => itemTag.toLowerCase() === normalizedTag);
        return matchesQuery && matchesTag;
      });
      setTracks(found);
      setLoading(false);
    });
  }, [activeQuery, query, tag]);

  return <main className="content-shell"><div className="search-heading"><div><p className="eyebrow">SEARCH LIBRARY</p><h1>Find a sound</h1></div><SearchBar defaultValue={query} /></div>{activeQuery && <p className="result-label">Results for <strong>“{query || tag}”</strong></p>}{loading ? <LoadingState /> : tracks.length ? <div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div> : <EmptyState title="No MIDI found" body="Try a different title, creator or tag." />}</main>;
}
export default function SearchPage() { return <><Navbar /><Suspense fallback={<main className="content-shell"><LoadingState /></main>}><SearchContent /></Suspense></>; }