"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import { UserAvatar } from "@/components/UserAvatar";

type CreatorRanking = {
  profile: Profile;
  weeklyFollowers: number;
  followerCount: number;
};

export function HomeLeaderboard() {
  const [creators, setCreators] = useState<CreatorRanking[]>([]);

  useEffect(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    Promise.all([
      supabase.from("profile_follows").select("profile_id, created_at"),
      supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, follower_count, created_at, account_status")
        .eq("account_status", "active"),
    ]).then(([followResult, profileResult]) => {
      const follows = followResult.data ?? [];
      const profileMap = new Map(
        ((profileResult.data as Profile[]) ?? []).map((p) => [p.id, p]),
      );

      const rankings = new Map<string, { weeklyFollowers: number; followerCount: number }>();
      follows.forEach((follow) => {
        const current = rankings.get(follow.profile_id) ?? {
          weeklyFollowers: 0,
          followerCount: 0,
        };
        current.followerCount += 1;
        if (follow.created_at >= weekAgo) current.weeklyFollowers += 1;
        rankings.set(follow.profile_id, current);
      });

      const ranked = Array.from(rankings.entries())
        .map(([id, counts]) => ({ profile: profileMap.get(id), ...counts }))
        .filter((c): c is CreatorRanking => Boolean(c.profile))
        .sort(
          (a, b) =>
            b.followerCount - a.followerCount ||
            b.weeklyFollowers - a.weeklyFollowers,
        )
        .slice(0, 10);

      setCreators(ranked);
    });
  }, []);

  if (!creators.length) return null;

  return (
    <section className="leaderboard-section">
      <div className="section-head">
        <div>
          <p className="eyebrow">
            <Trophy size={14} /> TOP CREATORS
          </p>
          <h2>Follower leaderboard</h2>
        </div>
        <span className="leaderboard-note">Ranked by total followers</span>
      </div>
      <div className="leaderboard-list">
        {creators.map(({ profile, weeklyFollowers, followerCount }, index) => (
          <Link
            className="leaderboard-row"
            href={`/user/${profile.username}`}
            key={profile.id}
          >
            <strong>#{index + 1}</strong>
            <UserAvatar username={profile.username} avatarUrl={profile.avatar_url} size="sm" />
            <span className="leaderboard-name">
              @{profile.username}
              <small>{followerCount} followers</small>
            </span>
            <span className="leaderboard-growth">
              +{weeklyFollowers}
              <small>this week</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
