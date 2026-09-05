"use client";

import { UserPlus, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export function FollowButton({ profileId, initialFollowerCount = 0 }: { profileId: string; initialFollowerCount?: number }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user || user.id === profileId) return;
    supabase.from("profile_follows").select("id").eq("profile_id", profileId).eq("follower_id", user.id).maybeSingle().then(({ data }) => setFollowing(Boolean(data)));
  }, [profileId, user]);

  if (!user || user.id === profileId) return null;

  const toggleFollow = async () => {
    setPending(true);
    setErrorMessage("");
    if (following) {
      const { error } = await supabase.from("profile_follows").delete().eq("profile_id", profileId).eq("follower_id", user.id);
      if (error) setErrorMessage("Follow se nepodařilo změnit.");
      else { setFollowing(false); setFollowerCount((count) => Math.max(0, count - 1)); }
    } else {
      const { error } = await supabase.from("profile_follows").insert({ profile_id: profileId, follower_id: user.id });
      if (error) setErrorMessage("Follow se nepodařilo změnit.");
      else { setFollowing(true); setFollowerCount((count) => count + 1); }
    }
    setPending(false);
  };

  return <div className="follow-control">
    <button className="follow-button" disabled={pending} onClick={toggleFollow} type="button">
      {following ? <UserRoundCheck size={15} /> : <UserPlus size={15} />}
      {following ? "Following" : "Follow"}
      <span>{followerCount}</span>
    </button>
    {errorMessage && <small className="follow-error">{errorMessage}</small>}
  </div>;
}