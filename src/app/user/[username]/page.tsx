import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import type { MidiFile, Profile } from "@/types/database";
import { UserProfileClient } from "@/components/UserProfileClient";

// ---------------------------------------------------------------------------
// Server-side data helpers
// ---------------------------------------------------------------------------

async function getProfile(username: string): Promise<Profile | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("account_status", "active")
      .eq("username", decodeURIComponent(username))
      .single();
    if (!data) return null;
    // Fetch follower count in parallel — single query, count only
    const { count } = await supabase
      .from("profile_follows")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", (data as Profile).id);
    return { ...(data as Profile), follower_count: count ?? 0 };
  } catch {
    return null;
  }
}

async function getPublicTracks(userId: string): Promise<MidiFile[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("midi_files")
      .select("*, profiles(username, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data as MidiFile[]) ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// generateMetadata — dynamic per-profile SEO
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const profile = await getProfile(decoded);

  if (!profile) {
    return { title: "Profile not found | Midylo" };
  }

  const title = `@${profile.username} | Midylo`;
  const description = profile.bio
    ? `${profile.bio} — Explore MIDI shared by @${profile.username} on Midylo.`
    : `Explore MIDI files shared by @${profile.username} on Midylo.`;
  const url = `https://midylo.com/user/${encodeURIComponent(profile.username)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
    },
  };
}

// ---------------------------------------------------------------------------
// Page — Server Component
// ---------------------------------------------------------------------------

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  const profile = await getProfile(decoded);
  if (!profile) notFound();

  const tracks = await getPublicTracks(profile.id);

  // Pass server-fetched data to the interactive Client Component
  return (
    <UserProfileClient
      initialProfile={profile}
      initialTracks={tracks}
    />
  );
}
