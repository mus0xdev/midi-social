"use client";

import Link from "next/link";
import { ArrowUpRight, Disc3, Headphones, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { MidiFile, Profile } from "@/types/database";

type CreatorRanking = { profile: Profile; weeklyFollowers: number; followerCount: number };

export default function Home() {
  const [tracks, setTracks] = useState<MidiFile[]>([]); const [loading, setLoading] = useState(isSupabaseConfigured);
  const [creators, setCreators] = useState<CreatorRanking[]>([]);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      supabase.from("midi_files").select("*, profiles(username, avatar_url)").order("created_at", { ascending: false }).limit(6),
      supabase.from("profile_follows").select("profile_id, created_at"),
      supabase.from("profiles").select("*")
    ]).then(([trackResult, followResult, profileResult]) => {
      setTracks((trackResult.data as MidiFile[]) || []);
      const follows = followResult.data || [];
      const profileMap = new Map((profileResult.data as Profile[] || []).map((profile) => [profile.id, profile]));
      const rankings = new Map<string, { weeklyFollowers: number; followerCount: number }>();
      follows.forEach((follow) => {
        const current = rankings.get(follow.profile_id) || { weeklyFollowers: 0, followerCount: 0 };
        current.followerCount += 1;
        if (follow.created_at >= weekAgo) current.weeklyFollowers += 1;
        rankings.set(follow.profile_id, current);
      });
      setCreators(Array.from(rankings.entries()).map(([id, counts]) => ({ profile: profileMap.get(id), ...counts })).filter((creator): creator is CreatorRanking => Boolean(creator.profile)).sort((a, b) => b.followerCount - a.followerCount || b.weeklyFollowers - a.weeklyFollowers).slice(0, 5));
      setLoading(false);
    });
  }, []);
  return <><Navbar /><main className="page-shell"><section className="hero"><div className="hero-copy"><p className="eyebrow"><Sparkles size={14} /> THE SOCIAL HOME FOR MIDI</p><h1>Make sound.<br /><em>Share the source.</em></h1><p className="hero-text">Discover, play and collect the building blocks behind your favorite music.</p><SearchBar large /><div className="hero-links"><Link href="/new">Explore newest <ArrowUpRight size={15} /></Link><span>10 MB max · .mid & .midi</span></div></div><div className="hero-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="hero-disc"><Disc3 size={72} /><span>MIDYLO</span></div><div className="floating-note note-one">♪</div><div className="floating-note note-two">♫</div></div></section><section className="section-head"><div><p className="eyebrow">FRESHLY DROPPED</p><h2>Newest MIDI</h2></div><Link className="view-all" href="/new">View all <ArrowUpRight size={15} /></Link></section>{loading ? <LoadingState /> : tracks.length ? <div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div> : <EmptyState title={isSupabaseConfigured ? "The studio is quiet" : "Connect your Supabase project"} body={isSupabaseConfigured ? "Upload the first MIDI and set the tone for the community." : "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to start loading your library."} />}<section className="leaderboard-section"><div className="section-head"><div><p className="eyebrow"><Trophy size={14} /> THIS WEEK</p><h2>Top creators</h2></div><span className="leaderboard-note">Ranked by total followers</span></div>{creators.length ? <div className="leaderboard-list">{creators.map(({ profile, weeklyFollowers, followerCount }, index) => <Link className="leaderboard-row" href={`/user/${profile.username}`} key={profile.id}><strong>#{index + 1}</strong><span className="leaderboard-avatar">{profile.username.slice(0, 1).toUpperCase()}</span><span className="leaderboard-name">@{profile.username}<small>{followerCount} total followers</small></span><span className="leaderboard-growth">+{weeklyFollowers}<small>this week</small></span></Link>)}</div> : <p className="empty-mini">No follower activity this week yet.</p>}</section><section className="feature-strip"><div><Headphones size={20} /><strong>Built for the source</strong><span>Every note, editable and yours to explore.</span></div><Link className="secondary-button" href="/upload">Upload your first MIDI <ArrowUpRight size={15} /></Link></section></main></>;
}
