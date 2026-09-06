"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export function ProfileSettingsForm() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [theme, setTheme] = useState<Profile["theme"]>("forest");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | "">("");

  async function uploadImage(event: ChangeEvent<HTMLInputElement>, kind: "avatar" | "banner") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { setError("Vyber obrázek."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Obrázek musí být menší než 10 MB."); return; }
    setUploading(kind); setError(""); setMessage("");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${kind}-${crypto.randomUUID()}.${extension}`;
    const result = await supabase.storage.from("profile-media").upload(path, file, { contentType: file.type, upsert: false });
    if (result.error) { setError(result.error.message); setUploading(""); return; }
    const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
    if (kind === "avatar") setAvatarUrl(data.publicUrl); else setBannerUrl(data.publicUrl);
    setMessage(`${kind === "avatar" ? "Profilovka" : "Banner"} nahrána. Ulož profil.`); setUploading("");
  }

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      const value = data as Profile | null;
      if (!value) return;
      setProfile(value); setBio(value.bio || ""); setAvatarUrl(value.avatar_url || ""); setBannerUrl(value.banner_url || "");
      setWebsiteUrl(value.website_url || ""); setGithubUrl(value.github_url || ""); setYoutubeUrl(value.youtube_url || ""); setTheme(value.theme || "forest");
    });
  }, [user]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true); setMessage(""); setError("");
    const result = await supabase.from("profiles").update({ bio: bio.trim() || null, avatar_url: avatarUrl.trim() || null, banner_url: bannerUrl.trim() || null, website_url: websiteUrl.trim() || null, github_url: githubUrl.trim() || null, youtube_url: youtubeUrl.trim() || null, theme }).eq("id", user.id);
    if (result.error) setError(result.error.message); else setMessage("Profile updated.");
    setSaving(false);
  }

  async function deleteAccount() {
    if (!user || !window.confirm("Delete your account and all uploaded MIDI permanently?")) return;
    setDeleting(true); setError("");
    const result = await supabase.rpc("delete_my_account");
    if (result.error) { setError(result.error.message); setDeleting(false); return; }
    await signOut();
    window.location.href = "/";
  }

  if (!user) return <div className="settings-card"><h2>Login required</h2><p>Sign in to edit your profile.</p><Link className="primary-button" href="/auth">Login</Link></div>;

  return <div className="settings-layout"><form className="settings-card upload-form" onSubmit={save}><div><p className="eyebrow">PROFILE CUSTOMIZATION</p><h1>Edit your profile</h1><p className="settings-subtitle">Shape how your creator page looks and feels.</p></div><label>Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} placeholder="Tell the community about your sound." /></label><div className="form-grid"><label>Profile picture<input className="media-file-input" type="file" accept="image/*" onChange={(event) => void uploadImage(event, "avatar")} />{uploading === "avatar" && <small>Uploading...</small>}<input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} type="url" placeholder="Or paste an image URL" /></label><label>Banner image<input className="media-file-input" type="file" accept="image/*" onChange={(event) => void uploadImage(event, "banner")} />{uploading === "banner" && <small>Uploading...</small>}<input value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} type="url" placeholder="Or paste an image URL" /></label></div><div className="form-grid"><label>Website<input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} type="url" placeholder="https://your-site.com" /></label><label>GitHub<input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} type="url" placeholder="https://github.com/username" /></label></div><label>YouTube<input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} type="url" placeholder="https://youtube.com/@username" /></label><label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value as Profile["theme"])}><option value="forest">Forest</option><option value="midnight">Midnight</option><option value="sunset">Sunset</option><option value="mono">Mono</option></select></label>{message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={saving || Boolean(uploading)}>{saving ? "Saving..." : "Save profile"}</button></form><section className="settings-card danger-zone"><p className="eyebrow">ACCOUNT</p><h2>Delete account</h2><p>This permanently removes your profile, MIDI uploads, likes, follows and comments.</p><button className="danger-button" disabled={deleting} onClick={() => void deleteAccount()} type="button">{deleting ? "Deleting..." : "Delete my account"}</button></section></div>;
}
