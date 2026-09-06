import { Navbar } from "@/components/Navbar";
import { ExploreClient } from "@/components/ExploreClient";
import { createServerClient } from "@/lib/supabase-server";
import type { MidiFile } from "@/types/database";

export const revalidate = 120;

async function getAllTracks(): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .order("plays", { ascending: false })
      .limit(200);
    return (data as MidiFile[]) ?? [];
  } catch {
    return [];
  }
}

export default async function ExplorePage() {
  const tracks = await getAllTracks();

  return (
    <>
      <Navbar />
      <ExploreClient initialTracks={tracks} />
    </>
  );
}
