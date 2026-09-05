"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { MidiFile } from "@/types/database";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [tracks, setTracks] = useState<MidiFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    supabase.from("likes").select("midi_files(*, profiles(username, avatar_url))").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      const favoriteTracks = (data || []).flatMap((like) => Array.isArray(like.midi_files) ? like.midi_files : [like.midi_files]).filter(Boolean) as unknown as MidiFile[];
      setTracks(favoriteTracks);
      setLoading(false);
    });
  }, [authLoading, user]);

  return <><Navbar /><main className="content-shell"><div className="page-heading"><p className="eyebrow">YOUR LIBRARY</p><h1>Favorites</h1><p>MIDI files you saved for later.</p></div>{loading ? <LoadingState /> : !user ? <EmptyState title="Log in to see favorites" body="Like a MIDI file to save it here." /> : tracks.length ? <div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div> : <EmptyState title="No favorites yet" body="Like a MIDI file and it will appear here." />}</main></>;
}
