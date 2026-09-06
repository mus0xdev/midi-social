"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Download, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MidiPlayer } from "@/components/MidiPlayer";
import { LikeButton } from "@/components/LikeButton";
import { DownloadButton } from "@/components/DownloadButton";
import { DeleteMidiButton } from "@/components/DeleteMidiButton";
import { ReportButton } from "@/components/ReportButton";
import { CommentSection } from "@/components/CommentSection";
import { LoadingState } from "@/components/EmptyState";
import { MidiCard } from "@/components/MidiCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { formatCount, formatDate } from "@/lib/format";
import type { MidiFile } from "@/types/database";

export default function MidiDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [midi, setMidi] = useState<MidiFile | null>(null);
  const [id, setId] = useState("");
  const [moreFromArtist, setMoreFromArtist] = useState<MidiFile[]>([]);
  const [recommendations, setRecommendations] = useState<MidiFile[]>([]);

  useEffect(() => {
    params.then(({ id: value }) => {
      setId(value);
      supabase.from("midi_files").select("*, profiles(username, avatar_url)").eq("id", value).single().then(async ({ data }) => {
        const current = data as MidiFile;
        setMidi(current);
        if (!current) return;

        const [artistResult, candidateResult, likedResult, followedResult] = await Promise.all([
          supabase.from("midi_files").select("*, profiles(username, avatar_url)").eq("user_id", current.user_id).neq("id", current.id).order("created_at", { ascending: false }).limit(4),
          supabase.from("midi_files").select("*, profiles(username, avatar_url)").neq("id", current.id).order("created_at", { ascending: false }).limit(100),
          user ? supabase.from("likes").select("midi_files(tags)").eq("user_id", user.id) : Promise.resolve({ data: [] }),
          user ? supabase.from("profile_follows").select("profile_id").eq("follower_id", user.id) : Promise.resolve({ data: [] }),
        ]);
        const artistTracks = (artistResult.data as MidiFile[]) || [];
        const candidates = (candidateResult.data as MidiFile[]) || [];
        const likedRows = (likedResult.data || []) as Array<{ midi_files: { tags?: string[] } | Array<{ tags?: string[] }> | null }>;
        const likedTags = likedRows.flatMap((like) => {
          const related = like.midi_files;
          return Array.isArray(related) ? related.flatMap((item) => item?.tags || []) : related?.tags || [];
        }).map((tag) => tag.toLowerCase());
        const followedIds = new Set((followedResult.data || []).map((follow) => follow.profile_id));
        const artistIds = new Set(artistTracks.map((track) => track.id));
        const ranked = candidates.filter((track) => !artistIds.has(track.id)).map((track, index) => {
          const sharedTags = (track.tags || []).filter((tag) => likedTags.includes(tag.toLowerCase())).length;
          const followsArtist = followedIds.has(track.user_id);
          const popularity = Math.min(4, Number(track.plays || 0) / 25);
          const freshness = Math.max(0, 2 - index / 30);
          return { track, score: sharedTags * 6 + (followsArtist ? 10 : 0) + popularity + freshness };
        }).sort((a, b) => b.score - a.score).slice(0, 4).map(({ track }) => track);
        setMoreFromArtist(artistTracks);
        setRecommendations(ranked);
      });
    });
  }, [params, user]);

  if (!midi) return <><Navbar /><main className="content-shell"><LoadingState /></main></>;
  const profile = midi.profiles;

  return <><Navbar /><main className="content-shell detail-shell">
    <Link className="back-link" href="/"><ArrowLeft size={15} /> Back to library</Link>
    <div className="detail-header">
      <div className="detail-art">♪</div>
      <div className="detail-copy">
        <p className="eyebrow">MIDI FILE · {midi.license}{midi.tone ? ` · ${midi.tone}` : ""}</p>
        <h1>{midi.title}</h1>
        <Link href={`/user/${profile?.username}`}>@{profile?.username || "unknown"}</Link>
        <p>{midi.description || "No description added yet."}</p>
        <div className="detail-meta"><span><CalendarDays size={14} /> {formatDate(midi.created_at)}</span><span><Eye size={14} /> {formatCount(midi.plays)} plays</span><span><Download size={14} /> {formatCount(midi.downloads)} saves</span></div>
        <div className="tag-row">{midi.tags?.map((tag) => <Link href={`/search?tag=${encodeURIComponent(tag)}`} className="tag" key={tag}>{tag}</Link>)}</div>
      </div>
      <div className="detail-actions"><LikeButton midiId={id} /><DownloadButton midi={midi} /><ReportButton midiId={midi.id} /><DeleteMidiButton midi={midi} /></div>
    </div>
    <MidiPlayer midi={midi} />
    {moreFromArtist.length > 0 && <section className="recommendation-section"><div className="section-head"><div><p className="eyebrow">FROM THIS CREATOR</p><h2>More from @{profile?.username || "this artist"}</h2></div></div><div className="track-grid">{moreFromArtist.map((track) => <MidiCard key={track.id} midi={track} />)}</div></section>}
    {recommendations.length > 0 && <section className="recommendation-section"><div className="section-head"><div><p className="eyebrow">FYP FOR YOU</p><h2>What you might like</h2></div><span className="recommendation-note">Based on your likes, follows and plays</span></div><div className="track-grid">{recommendations.map((track) => <MidiCard key={track.id} midi={track} />)}</div></section>}
    <CommentSection midiId={id} />
  </main></>;
}
