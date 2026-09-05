"use client";
import Link from "next/link";
import { Download, Play, ChevronRight, Eye } from "lucide-react";
import type { MidiFile } from "@/types/database";
import { formatCount, formatDate } from "@/lib/format";
import { AvatarLink } from "@/components/UserAvatar";
import { DownloadButton } from "@/components/DownloadButton";

export function MidiCard({ midi, onPlay }: { midi: MidiFile; onPlay?: (midi: MidiFile) => void }) {
  const profile = midi.profiles; const tags = midi.tags?.slice(0, 2) || [];
  return <article className="midi-card"><div className="track-art"><span className="art-note">♪</span><button className="play-button" title={`Play ${midi.title}`} onClick={() => onPlay?.(midi)}><Play size={17} fill="currentColor" /></button></div><div className="track-main"><div className="track-title-row"><div><Link href={`/midi/${midi.id}`} className="track-title">{midi.title}</Link><div className="track-author"><AvatarLink username={profile?.username || "unknown"} avatarUrl={profile?.avatar_url} /><Link href={`/user/${profile?.username || "unknown"}`}>@{profile?.username || "unknown"}</Link></div></div><Link className="card-arrow" href={`/midi/${midi.id}`}><ChevronRight size={18} /></Link></div><div className="tag-row">{tags.map((tag) => <Link href={`/search?tag=${encodeURIComponent(tag)}`} className="tag" key={tag}>{tag}</Link>)}</div><div className="track-meta"><span>{formatDate(midi.created_at)}</span><span><Eye size={14} /> {formatCount(midi.plays)}</span><span><Download size={14} /> {formatCount(midi.downloads)}</span><DownloadButton midi={midi} compact /></div></div></article>;
}