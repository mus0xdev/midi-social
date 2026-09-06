import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase-server";

const BASE_URL = "https://midylo.com";

// Sitemap revalidates once per day — avoids hammering the DB on every request
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages always present
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${BASE_URL}/new`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date("2026-09-05"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date("2026-09-05"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/copyright`, lastModified: new Date("2026-09-05"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: new Date("2026-09-05"), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = createServerClient();

    // Fetch only the columns we need — no SELECT *
    const [midiResult, profileResult] = await Promise.all([
      supabase
        .from("midi_files")
        .select("id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("profiles")
        .select("username, created_at")
        .eq("account_status", "active")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    const midiRows = (midiResult.data ?? []) as Array<{ id: string; updated_at: string }>;
    const profileRows = (profileResult.data ?? []) as Array<{ username: string; created_at: string }>;

    const midiRoutes: MetadataRoute.Sitemap = midiRows.map((row) => ({
      url: `${BASE_URL}/midi/${row.id}`,
      lastModified: new Date(row.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const profileRoutes: MetadataRoute.Sitemap = profileRows.map((row) => ({
      url: `${BASE_URL}/user/${encodeURIComponent(row.username)}`,
      lastModified: new Date(row.created_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...midiRoutes, ...profileRoutes];
  } catch {
    // If DB is unavailable, return only static routes — never break the build
    return staticRoutes;
  }
}
