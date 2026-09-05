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
import { supabase } from "@/lib/supabase";
import { formatCount, formatDate } from "@/lib/format";
import type { MidiFile } from "@/types/database";

export default function MidiDetail({ params }: { params: Promise<{ id: string }> }) {
  const [midi, setMidi] = useState<MidiFile | null>(null);
  const [id, setId] = useState("");

  useEffect(() => {
    params.then(({ id: value }) => {
      setId(value);
      supabase.from("midi_files").select("*, profiles(username, avatar_url)").eq("id", value).single().then(({ data }) => {
        setMidi(data as MidiFile);
      });
    });
  }, [params]);

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
    <CommentSection midiId={id} />
  </main></>;
}
