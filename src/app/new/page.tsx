import { createServerClient } from "@/lib/supabase-server";
import type { MidiFile } from "@/types/database";
import { Navbar } from "@/components/Navbar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState } from "@/components/EmptyState";

// Revalidate every 60 seconds — fresh content without hammering the DB on every request
export const revalidate = 60;

async function getNewestTracks(): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(48); // Reasonable limit — was previously unlimited
    return (data as MidiFile[]) ?? [];
  } catch {
    return [];
  }
}

export default async function NewPage() {
  const tracks = await getNewestTracks();

  return (
    <>
      <Navbar />
      <main className="content-shell">
        <div className="page-heading">
          <p className="eyebrow">THE LATEST UPLOADS</p>
          <h1>Newest MIDI</h1>
          <p>Fresh files from the community, ready to play.</p>
        </div>
        {tracks.length ? (
          <div className="track-grid">
            {tracks.map((midi) => (
              <MidiCard key={midi.id} midi={midi} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </>
  );
}
