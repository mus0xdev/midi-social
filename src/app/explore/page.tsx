import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import type { MidiFile } from "@/types/database";
import { Navbar } from "@/components/Navbar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState } from "@/components/EmptyState";
import { GENRES } from "@/lib/genres";

export const revalidate = 120;

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getMostPlayed(): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .order("plays", { ascending: false })
      .limit(6);
    return (data as MidiFile[]) ?? [];
  } catch {
    return [];
  }
}

async function getMostDownloaded(): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .order("downloads", { ascending: false })
      .limit(6);
    return (data as MidiFile[]) ?? [];
  } catch {
    return [];
  }
}

async function getByGenre(genre: string): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .contains("tags", [genre])
      .order("plays", { ascending: false })
      .limit(12);
    return (data as MidiFile[]) ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre } = await searchParams;
  const activeGenre = genre ?? "";

  const [mostPlayed, mostDownloaded, genreTracks] = await Promise.all([
    activeGenre ? Promise.resolve([]) : getMostPlayed(),
    activeGenre ? Promise.resolve([]) : getMostDownloaded(),
    activeGenre ? getByGenre(activeGenre) : Promise.resolve([]),
  ]);

  return (
    <>
      <Navbar />
      <main className="content-shell">
        <div className="page-heading">
          <p className="eyebrow">DISCOVER MUSIC</p>
          <h1>Explore</h1>
          <p>Browse by genre, or dive into the most played and downloaded tracks.</p>
        </div>

        {/* Genre filter */}
        <section className="genre-filter">
          <div className="results-section-head">
            <h2>Genres</h2>
            <span>{GENRES.length} available</span>
          </div>
          <div className="genre-list">
            <Link
              href="/explore"
              className={!activeGenre ? "genre-chip active" : "genre-chip"}
            >
              All
            </Link>
            {GENRES.map((g) => (
              <Link
                key={g}
                href={`/explore?genre=${encodeURIComponent(g)}`}
                className={
                  activeGenre.toLowerCase() === g.toLowerCase()
                    ? "genre-chip active"
                    : "genre-chip"
                }
              >
                {g}
              </Link>
            ))}
          </div>
        </section>

        {/* Genre results */}
        {activeGenre && (
          <section className="explore-section">
            <div className="results-section-head">
              <h2>{activeGenre}</h2>
              <span>{genreTracks.length} tracks</span>
            </div>
            {genreTracks.length ? (
              <div className="track-grid">
                {genreTracks.map((midi) => (
                  <MidiCard key={midi.id} midi={midi} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No tracks in this genre yet"
                body="Be the first to upload one."
              />
            )}
          </section>
        )}

        {/* Default view — most played + most downloaded */}
        {!activeGenre && (
          <>
            <section className="explore-section">
              <div className="results-section-head">
                <h2>Most played</h2>
                <Link className="view-all" href="/explore">all time</Link>
              </div>
              {mostPlayed.length ? (
                <div className="track-grid">
                  {mostPlayed.map((midi) => (
                    <MidiCard key={midi.id} midi={midi} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </section>

            <section className="explore-section">
              <div className="results-section-head">
                <h2>Most downloaded</h2>
                <Link className="view-all" href="/explore">all time</Link>
              </div>
              {mostDownloaded.length ? (
                <div className="track-grid">
                  {mostDownloaded.map((midi) => (
                    <MidiCard key={midi.id} midi={midi} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
