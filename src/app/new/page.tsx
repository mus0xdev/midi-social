"use client";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import type { MidiFile } from "@/types/database";
export default function NewPage() { const [tracks, setTracks] = useState<MidiFile[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { supabase.from("midi_files").select("*, profiles(username, avatar_url)").order("created_at", { ascending: false }).then(({ data }) => { setTracks((data as MidiFile[]) || []); setLoading(false); }); }, []); return <><Navbar /><main className="content-shell"><div className="page-heading"><p className="eyebrow">THE LATEST UPLOADS</p><h1>Newest MIDI</h1><p>Fresh files from the community, ready to play.</p></div>{loading ? <LoadingState /> : tracks.length ? <div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div> : <EmptyState />}</main></>; }