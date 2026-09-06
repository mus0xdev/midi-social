"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";
import { supabase } from "@/lib/supabase";
import type { MidiFile, Profile } from "@/types/database";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [tracks, setTracks] = useState<MidiFile[]>([]);
  const [creators, setCreators] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      supabase.from("likes").select("midi_files(*, profiles(username, avatar_url))").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profile_follows").select("profile_id").eq("follower_id", user.id),
    ]).then(async ([likesResult, followsResult]) => {
      const favoriteTracks = (likesResult.data || []).flatMap((like) => Array.isArray(like.midi_files) ? like.midi_files : [like.midi_files]).filter(Boolean) as unknown as MidiFile[];
      const followedIds = (followsResult.data || []).map((follow) => follow.profile_id);
      const creatorResult = followedIds.length ? await supabase.from("profiles").select("*").in("id", followedIds) : { data: [] };
      setTracks(favoriteTracks);
      setCreators((creatorResult.data as Profile[]) || []);
      setLoading(false);
    });
  }, [authLoading, user]);

  return <><Navbar /><main className="content-shell"><div className="page-heading"><p className="eyebrow">YOUR LIBRARY</p><h1>Favorites</h1><p>MIDI files and creators you saved for later.</p></div>{loading ? <LoadingState /> : !user ? <EmptyState title="Log in to see favorites" body="Like a MIDI file or follow a creator to save it here." /> : <>{creators.length > 0 && <section className="creator-favorites"><div className="section-head"><div><p className="eyebrow">FOLLOWING</p><h2>Creators you follow</h2></div><span className="favorite-count">{creators.length}</span></div><div className="followed-creator-grid">{creators.map((creator) => <Link className="followed-creator-card" href={`/user/${encodeURIComponent(creator.username)}`} key={creator.id}><UserAvatar username={creator.username} avatarUrl={creator.avatar_url} size="lg" /><span><strong>@{creator.username}</strong><small>{creator.bio || "Creator on Midylo"}</small></span></Link>)}</div></section>}<section className="favorite-tracks"><div className="section-head"><div><p className="eyebrow">SAVED MIDI</p><h2>Your favorites</h2></div><span className="favorite-count">{tracks.length}</span></div>{tracks.length ? <div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div> : <EmptyState title="No favorites yet" body="Like a MIDI file and it will appear here." />}</section></>}</main></>;
}
