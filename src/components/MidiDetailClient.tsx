"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Download, Eye } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MidiPlayer } from "@/components/MidiPlayer";
import { LikeButton } from "@/components/LikeButton";
import { DownloadButton } from "@/components/DownloadButton";
import { DeleteMidiButton } from "@/components/DeleteMidiButton";
import { ReportButton } from "@/components/ReportButton";
import { CommentSection } from "@/components/CommentSection";
import { MidiCard } from "@/components/MidiCard";
import { formatCount, formatDate } from "@/lib/format";
import type { MidiFile } from "@/types/database";

interface Props {
  initialMidi: MidiFile;
  initialMoreFromArtist: MidiFile[];
  initialRelated: MidiFile[];
}

export function MidiDetailClient({
  initialMidi,
  initialMoreFromArtist,
  initialRelated,
}: Props) {
  const midi = initialMidi;
  const profile = midi.profiles;
  const moreFromArtist = initialMoreFromArtist;
  const recommendations = initialRelated;

  return (
    <>
      <Navbar />
      <main className="content-shell detail-shell">
        <Link className="back-link" href="/">
          <ArrowLeft size={15} /> Back to library
        </Link>

        {/* ------------------------------------------------------------------ */}
        {/* Detail header — server-rendered content, visible to crawlers       */}
        {/* ------------------------------------------------------------------ */}
        <div className="detail-header">
          <div className="detail-art">♪</div>
          <div className="detail-copy">
            <p className="eyebrow">
              MIDI FILE · {midi.license}
              {midi.tone ? ` · ${midi.tone}` : ""}
            </p>
            <h1>{midi.title}</h1>
            <Link href={`/user/${profile?.username}`}>
              @{profile?.username ?? "unknown"}
            </Link>
            <p>{midi.description ?? "No description added yet."}</p>
            <div className="detail-meta">
              <span>
                <CalendarDays size={14} /> {formatDate(midi.created_at)}
              </span>
              <span>
                <Eye size={14} /> {formatCount(midi.plays)} plays
              </span>
              <span>
                <Download size={14} /> {formatCount(midi.downloads)} saves
              </span>
            </div>
            <div className="tag-row">
              {midi.tags?.map((tag) => (
                <Link
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="tag"
                  key={tag}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          <div className="detail-actions">
            <LikeButton midiId={midi.id} />
            <DownloadButton midi={midi} />
            <ReportButton midiId={midi.id} />
            <DeleteMidiButton midi={midi} />
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Interactive player — client-side only                              */}
        {/* ------------------------------------------------------------------ */}
        <MidiPlayer midi={midi} />

        {/* ------------------------------------------------------------------ */}
        {/* More from artist                                                   */}
        {/* ------------------------------------------------------------------ */}
        {moreFromArtist.length > 0 && (
          <section className="recommendation-section">
            <div className="section-head">
              <div>
                <p className="eyebrow">FROM THIS CREATOR</p>
                <h2>More from @{profile?.username ?? "this artist"}</h2>
              </div>
            </div>
            <div className="track-grid">
              {moreFromArtist.map((track) => (
                <MidiCard key={track.id} midi={track} />
              ))}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Related tracks                                                      */}
        {/* ------------------------------------------------------------------ */}
        {recommendations.length > 0 && (
          <section className="recommendation-section">
            <div className="section-head">
              <div>
                <p className="eyebrow">YOU MIGHT ALSO LIKE</p>
                <h2>Related MIDI</h2>
              </div>
            </div>
            <div className="track-grid">
              {recommendations.map((track) => (
                <MidiCard key={track.id} midi={track} />
              ))}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Comments — client-side interactive                                 */}
        {/* ------------------------------------------------------------------ */}
        <CommentSection midiId={midi.id} />
      </main>
    </>
  );
}
