"use client";

import Link from "next/link";
import { BarChart3, Music4, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MidiCard } from "@/components/MidiCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { FollowButton } from "@/components/FollowButton";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";
import { supabase } from "@/lib/supabase";
import type { MidiFile, Profile } from "@/types/database";

type StudioTab = "overview" | "uploads" | "analytics";

export default function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tracks, setTracks] = useState<MidiFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StudioTab>("overview");
  const isOwner = Boolean(!authLoading && user && profile && user.id === profile.id);

  useEffect(() => {
    params.then(({ username }) =>
      supabase
        .from("profiles")
        .select("*")
        .eq("username", decodeURIComponent(username))
        .single()
        .then(async ({ data }) => {
          if (data) {
            const profileData = data as Profile;
            const followerResult = await supabase
              .from("profile_follows")
              .select("id", { count: "exact", head: true })
              .eq("profile_id", profileData.id);
            setProfile({ ...profileData, follower_count: followerResult.count || 0 });
            const result = await supabase
              .from("midi_files")
              .select("*, profiles(username, avatar_url)")
              .eq("user_id", (data as Profile).id)
              .order("created_at", { ascending: false });
            setTracks((result.data as MidiFile[]) || []);
          }
          setLoading(false);
        }),
    );
  }, [params]);

  const stats = useMemo(() => {
    const totalPlays = tracks.reduce((sum, track) => sum + Number(track.plays || 0), 0);
    const totalDownloads = tracks.reduce((sum, track) => sum + Number(track.downloads || 0), 0);
    const avgPlays = tracks.length ? Math.round(totalPlays / tracks.length) : 0;

    const tagCounts: Record<string, number> = {};
    tracks.forEach((track) => {
      (track.tags || []).forEach((tag) => {
        const normalizedTag = tag.toLowerCase();
        tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag, count]) => ({ tag, count }));

    const bestTrack = [...tracks].sort((a, b) => Number(b.plays || 0) - Number(a.plays || 0))[0] || null;

    return {
      totalTracks: tracks.length,
      totalPlays,
      totalDownloads,
      avgPlays,
      topTags,
      bestTrack,
    };
  }, [tracks]);

  if (loading) {
    return <><Navbar /><main className="content-shell"><LoadingState /></main></>;
  }

  return <>
    <Navbar />
    <main className="content-shell studio-shell">
      {profile ? (
        <>
          <div className="studio-header">
            <div className="profile-hero">
              <UserAvatar username={profile.username} avatarUrl={profile.avatar_url} size="lg" />
              <div>
                {isOwner && <p className="eyebrow">CREATOR STUDIO</p>}
                <h1>@{profile.username}</h1>
                <p>{profile.bio || "Making music, one note at a time."}</p>
                <span>{tracks.length} MIDI files · {profile.follower_count || 0} followers</span>
              </div>
            </div>
            {isOwner && (
              <Link className="studio-upload-button" href="/upload">
                <UploadCloud size={16} /> Upload MIDI
              </Link>
            )}
            {!isOwner && <FollowButton profileId={profile.id} initialFollowerCount={profile.follower_count || 0} />}
          </div>

          {isOwner ? <>
            <div className="studio-tabs" role="tablist" aria-label="Creator studio tabs">
            <button className={activeTab === "overview" ? "studio-tab active" : "studio-tab"} onClick={() => setActiveTab("overview")} type="button">
              <BarChart3 size={15} /> Overview
            </button>
            <button className={activeTab === "uploads" ? "studio-tab active" : "studio-tab"} onClick={() => setActiveTab("uploads")} type="button">
              <Music4 size={15} /> Uploads
            </button>
            <button className={activeTab === "analytics" ? "studio-tab active" : "studio-tab"} onClick={() => setActiveTab("analytics")} type="button">
              <BarChart3 size={15} /> Analytics
            </button>
            </div>

            {activeTab === "overview" && (
            <>
              <div className="studio-grid">
                <div className="studio-card">
                  <span>Total uploads</span>
                  <strong>{stats.totalTracks}</strong>
                  <small>{tracks.length ? "Active library" : "Ready for your first upload"}</small>
                </div>
                <div className="studio-card">
                  <span>Followers</span>
                  <strong>{profile.follower_count || 0}</strong>
                  <small>People following your work</small>
                </div>
                <div className="studio-card">
                  <span>Total plays</span>
                  <strong>{stats.totalPlays}</strong>
                  <small>{stats.bestTrack ? `Top: ${stats.bestTrack.title}` : "No plays yet"}</small>
                </div>
                <div className="studio-card">
                  <span>Total downloads</span>
                  <strong>{stats.totalDownloads}</strong>
                  <small>{stats.avgPlays} avg. plays / track</small>
                </div>
                <div className="studio-card">
                  <span>Top tag</span>
                  {stats.topTags.length ? (
                    <>
                      <Link className="tag-link" href={`/search?tag=${encodeURIComponent(stats.topTags[0].tag)}`}>#{stats.topTags[0].tag}</Link>
                      <small>{stats.topTags[0].count} tracks</small>
                    </>
                  ) : (
                    <>
                      <strong>—</strong>
                      <small>No tags yet</small>
                    </>
                  )}
                </div>
              </div>

              <div className="studio-panels">
                <div className="studio-panel">
                  <div className="panel-header">
                    <h3>Top performers</h3>
                  </div>
                  {tracks.length ? (
                    <ul className="rank-list">
                      {[...tracks].sort((a, b) => Number(b.plays || 0) - Number(a.plays || 0)).slice(0, 4).map((track, index) => (
                        <li key={track.id}>
                          <span className="rank">#{index + 1}</span>
                          <div>
                            <strong>{track.title}</strong>
                            <small>{track.plays || 0} plays</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-mini">No uploads yet.</p>
                  )}
                </div>

                <div className="studio-panel">
                  <div className="panel-header">
                    <h3>Popular tags</h3>
                  </div>
                  {stats.topTags.length ? (
                    <div className="tag-cloud">
                      {stats.topTags.map(({ tag, count }) => (
                        <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`} className="tag-chip">#{tag} <span>{count}</span></Link>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-mini">No tag activity yet.</p>
                  )}
                </div>
              </div>
            </>
          )}

            {activeTab === "uploads" && (
            <div className="studio-content-block">
              {tracks.length ? <div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div> : <EmptyState />}
            </div>
          )}

            {activeTab === "analytics" && (
            <div className="studio-content-block">
              <div className="analytics-table">
                <div className="analytics-head">
                  <span>Track</span>
                  <span>Plays</span>
                  <span>Downloads</span>
                  <span>Engagement</span>
                </div>
                {tracks.length ? (
                  [...tracks].sort((a, b) => Number(b.plays || 0) - Number(a.plays || 0)).map((track) => {
                    const engagement = Math.max(0, Math.round((Number(track.downloads || 0) / Math.max(Number(track.plays || 0), 1)) * 100));
                    return (
                      <div key={track.id} className="analytics-row">
                        <span>{track.title}</span>
                        <span>{track.plays || 0}</span>
                        <span>{track.downloads || 0}</span>
                        <span>{engagement}%</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="analytics-row empty-row"><span>No analytics yet.</span></div>
                )}
              </div>
            </div>
            )}
          </> : (
            <div className="studio-content-block">
              {tracks.length ? <div className="track-grid">{tracks.map((midi) => <MidiCard key={midi.id} midi={midi} />)}</div> : <EmptyState />}
            </div>
          )}
        </>
      ) : (
        <EmptyState title="Profile not found" />
      )}
    </main>
  </>;
}
