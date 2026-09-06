"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState } from "@/components/EmptyState";
import { GENRES } from "@/lib/genres";
import type { MidiFile } from "@/types/database";

interface Props {
  initialTracks: MidiFile[];
}

function ExploreContent({ initialTracks }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeGenre = searchParams.get("genre") ?? "";

  const { mostPlayed, mostDownloaded, genreTracks } = useMemo(() => {
    const sorted = [...initialTracks];

    if (activeGenre) {
      const lower = activeGenre.toLowerCase();
      const genreTracks = sorted.filter((midi) =>
        (midi.tags ?? []).some((tag) => tag.toLowerCase() === lower),
      );
      return { mostPlayed: [], mostDownloaded: [], genreTracks };
    }

    const mostPlayed = [...sorted]
      .sort((a, b) => Number(b.plays ?? 0) - Number(a.plays ?? 0))
      .slice(0, 6);

    const mostDownloaded = [...sorted]
      .sort((a, b) => Number(b.downloads ?? 0) - Number(a.downloads ?? 0))
      .slice(0, 6);

    return { mostPlayed, mostDownloaded, genreTracks: [] };
  }, [initialTracks, activeGenre]);

  function selectGenre(genre: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (genre) {
      params.set("genre", genre);
    } else {
      params.delete("genre");
    }
    router.push(`/explore?${params.toString()}`, { scroll: false });
  }

  return (
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
          <button
            className={!activeGenre ? "genre-chip active" : "genre-chip"}
            onClick={() => selectGenre("")}
            type="button"
          >
            All
          </button>
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              className={
                activeGenre.toLowerCase() === g.toLowerCase()
                  ? "genre-chip active"
                  : "genre-chip"
              }
              onClick={() => selectGenre(g)}
            >
              {g}
            </button>
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

      {/* Default — most played + most downloaded */}
      {!activeGenre && (
        <>
          <section className="explore-section">
            <div className="results-section-head">
              <h2>Most played</h2>
              <span>all time</span>
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
              <span>all time</span>
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
  );
}

export function ExploreClient({ initialTracks }: Props) {
  return (
    <Suspense fallback={<main className="content-shell"><div className="page-heading"><p className="eyebrow">DISCOVER MUSIC</p><h1>Explore</h1></div></main>}>
      <ExploreContent initialTracks={initialTracks} />
    </Suspense>
  );
}
