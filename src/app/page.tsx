import Link from "next/link";
import { ArrowUpRight, Disc3, Headphones, Sparkles } from "lucide-react";
import { createServerClient } from "@/lib/supabase-server";
import type { MidiFile } from "@/types/database";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState } from "@/components/EmptyState";
import { HomeLeaderboard } from "@/components/HomeLeaderboard";

// Revalidate homepage every 60 seconds for ISR
export const revalidate = 60;

async function getNewestTracks(): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(6);
    return (data as MidiFile[]) ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const tracks = await getNewestTracks();

  return (
    <>
      <Navbar />
      <main className="page-shell">
        {/* ------------------------------------------------------------------ */}
        {/* Hero — fully static, great for SEO                                 */}
        {/* ------------------------------------------------------------------ */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={14} /> THE SOCIAL HOME FOR MIDI
            </p>
            <h1>
              Make sound.<br />
              <em>Share the source.</em>
            </h1>
            <p className="hero-text">
              Discover, play and collect the building blocks behind your favorite music.
            </p>
            <SearchBar large />
            <div className="hero-links">
              <Link href="/new">
                Explore newest <ArrowUpRight size={15} />
              </Link>
              <span>10 MB max · .mid &amp; .midi</span>
            </div>
          </div>
          <div className="hero-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="hero-disc">
              <Disc3 size={72} />
              <span>MIDYLO</span>
            </div>
            <div className="floating-note note-one">♪</div>
            <div className="floating-note note-two">♫</div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Newest MIDI — server-rendered, indexable                           */}
        {/* ------------------------------------------------------------------ */}
        <section className="section-head">
          <div>
            <p className="eyebrow">FRESHLY DROPPED</p>
            <h2>Newest MIDI</h2>
          </div>
          <Link className="view-all" href="/new">
            View all <ArrowUpRight size={15} />
          </Link>
        </section>

        {tracks.length ? (
          <div className="track-grid">
            {tracks.map((midi) => (
              <MidiCard key={midi.id} midi={midi} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="The studio is quiet"
            body="Upload the first MIDI and set the tone for the community."
          />
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Top creators leaderboard — client-side (needs follower aggregation) */}
        {/* ------------------------------------------------------------------ */}
        <HomeLeaderboard />

        {/* ------------------------------------------------------------------ */}
        {/* Feature strip                                                       */}
        {/* ------------------------------------------------------------------ */}
        <section className="feature-strip">
          <div>
            <Headphones size={20} />
            <strong>Built for the source</strong>
            <span>Every note, editable and yours to explore.</span>
          </div>
          <Link className="secondary-button" href="/upload">
            Upload your first MIDI <ArrowUpRight size={15} />
          </Link>
        </section>
      </main>
    </>
  );
}
