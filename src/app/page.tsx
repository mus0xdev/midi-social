"use client";

import Link from "next/link";
import { ArrowUpRight, Disc3, Headphones, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { MidiFile } from "@/types/database";

export default function Home() {
  const [tracks, setTracks] = useState<MidiFile[]>([]); const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => { if (!isSupabaseConfigured) return; supabase.from("midi_files").select("*, profiles(username, avatar_url)").order("created_at", { ascending: false }).limit(6).then(({ data }) => { setTracks((data as MidiFile[]) || []); setLoading(false); }); }, []);
  return <><Navbar /><main className="page-shell"><section className="hero"><div className="hero-copy"><p className="eyebrow"><Sparkles size={14} /> THE SOCIAL HOME FOR MIDI</p><h1>Make sound.<br /><em>Share the source.</em></h1><p className="hero-text">Discover, play and collect the building blocks behind your favorite music.</p><SearchBar large /><div className="hero-links"><Link href="/new">Explore newest <ArrowUpRight size={15} /></Link><span>10 MB max · .mid & .midi</span></div></div><div className="hero-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="hero-disc"><Disc3 size={72} /><span>MIDYLO</span></div><div className="floating-note note-one">♪</div><div className="floating-note note-two">♫</div></div></section><section className="section-head"><div><p className="eyebrow">FRESHLY DROPPED</p><h2>Newest MIDI</h2></div><Link className="view-all" href="/new">View all <ArrowUpRight size={15} /></Link></section>{loading ? <LoadingState /> : tracks.length ? <div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div> : <EmptyState title={isSupabaseConfigured ? "The studio is quiet" : "Connect your Supabase project"} body={isSupabaseConfigured ? "Upload the first MIDI and set the tone for the community." : "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to start loading your library."} />}<section className="feature-strip"><div><Headphones size={20} /><strong>Built for the source</strong><span>Every note, editable and yours to explore.</span></div><Link className="secondary-button" href="/upload">Upload your first MIDI <ArrowUpRight size={15} /></Link></section></main></>;
}
