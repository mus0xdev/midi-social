import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import type { MidiFile } from "@/types/database";
import { MidiDetailClient } from "@/components/MidiDetailClient";

// ---------------------------------------------------------------------------
// Server-side data helpers
// ---------------------------------------------------------------------------

async function getMidi(id: string): Promise<MidiFile | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .eq("id", id)
      .single();
    return data ? (data as MidiFile) : null;
  } catch {
    return null;
  }
}

async function getMoreFromArtist(userId: string, excludeId: string): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .eq("user_id", userId)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(4);
    return (data as MidiFile[]) ?? [];
  } catch {
    return [];
  }
}

async function getRelatedTracks(currentId: string, tags: string[]): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .neq("id", currentId)
      .order("created_at", { ascending: false })
      .limit(4);
    if (!data) return [];
    // Simple tag-based ranking — no N+1, single query
    const tracks = data as MidiFile[];
    if (!tags.length) return tracks.slice(0, 4);
    const lowerTags = tags.map((t) => t.toLowerCase());
    return [...tracks]
      .map((track) => ({
        track,
        score: (track.tags || []).filter((t) => lowerTags.includes(t.toLowerCase())).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ track }) => track);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// generateMetadata — dynamic per-MIDI SEO
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const midi = await getMidi(id);

  if (!midi) {
    return { title: "MIDI not found | Midylo" };
  }

  const author = midi.profiles?.username ?? "unknown";
  const title = `${midi.title} by @${author} | Midylo`;
  const description = midi.description
    ? `${midi.description.slice(0, 140)} — Shared by @${author} on Midylo.`
    : `Listen to and explore "${midi.title}", shared by @${author} on Midylo.`;
  const url = `https://midylo.com/midi/${midi.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "music.song",
    },
  };
}

// ---------------------------------------------------------------------------
// Page — Server Component
// ---------------------------------------------------------------------------

export default async function MidiDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const midi = await getMidi(id);
  if (!midi) notFound();

  // Fetch supporting data in parallel — 2 queries, not N+1
  const [moreFromArtist, related] = await Promise.all([
    getMoreFromArtist(midi.user_id, midi.id),
    getRelatedTracks(midi.id, midi.tags ?? []),
  ]);

  return (
    <MidiDetailClient
      initialMidi={midi}
      initialMoreFromArtist={moreFromArtist}
      initialRelated={related}
    />
  );
}
