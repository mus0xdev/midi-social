"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Profile, ProfileLink } from "@/types/database";

const MAX_LINKS = 8;

export function ProfileSettingsForm() {
  const { user, signOut } = useAuth();
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [theme, setTheme] = useState<Profile["theme"]>("forest");
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | "">("");

  // -----------------------------------------------------------------------
  // Load profile
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const p = data as Profile | null;
        if (!p) return;
        setBio(p.bio ?? "");
        setAvatarUrl(p.avatar_url ?? "");
        setBannerUrl(p.banner_url ?? "");
        setTheme(p.theme ?? "forest");
        // Migrate old fixed fields → links array on first load
        const loaded: ProfileLink[] = Array.isArray(p.links) ? [...p.links] : [];
        if (!loaded.length) {
          if (p.website_url) loaded.push({ label: "Website", url: p.website_url });
          if (p.github_url) loaded.push({ label: "GitHub", url: p.github_url });
          if (p.youtube_url) loaded.push({ label: "YouTube", url: p.youtube_url });
        }
        setLinks(loaded);
      });
  }, [user]);

  // -----------------------------------------------------------------------
  // Image upload
  // -----------------------------------------------------------------------
  async function uploadImage(event: ChangeEvent<HTMLInputElement>, kind: "avatar" | "banner") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { setError("Vyber obrázek."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Obrázek musí být menší než 10 MB."); return; }
    setUploading(kind); setError(""); setMessage("");
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${kind}-${crypto.randomUUID()}.${extension}`;
    const result = await supabase.storage
      .from("profile-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (result.error) { setError(result.error.message); setUploading(""); return; }
    const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
    if (kind === "avatar") setAvatarUrl(data.publicUrl);
    else setBannerUrl(data.publicUrl);
    setMessage(`${kind === "avatar" ? "Profilovka" : "Banner"} nahrána. Ulož profil.`);
    setUploading("");
  }

  // -----------------------------------------------------------------------
  // Links helpers
  // -----------------------------------------------------------------------
  function addLink() {
    if (links.length >= MAX_LINKS) return;
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function updateLink(index: number, field: keyof ProfileLink, value: string) {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    // Validate links — skip empty rows, reject malformed URLs
    const cleanLinks = links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.url);

    for (const l of cleanLinks) {
      try {
        new URL(l.url);
      } catch {
        setError(`Invalid URL: "${l.url}"`);
        return;
      }
    }

    setSaving(true); setMessage(""); setError("");

    // Keep legacy columns in sync for backward compatibility
    const firstLink = cleanLinks[0];
    const websiteUrl = firstLink?.url ?? null;
    const githubLink = cleanLinks.find((l) => l.label.toLowerCase().includes("github"));
    const youtubeLink = cleanLinks.find((l) => l.label.toLowerCase().includes("youtube"));

    const result = await supabase
      .from("profiles")
      .update({
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
        website_url: websiteUrl,
        github_url: githubLink?.url ?? null,
        youtube_url: youtubeLink?.url ?? null,
        links: cleanLinks,
        theme,
      })
      .eq("id", user.id);

    if (result.error) setError(result.error.message);
    else setMessage("Profile updated.");
    setSaving(false);
  }

  // -----------------------------------------------------------------------
  // Delete account
  // -----------------------------------------------------------------------
  async function deleteAccount() {
    if (!user || !window.confirm("Delete your account and all uploaded MIDI permanently?")) return;
    setDeleting(true); setError("");
    const result = await supabase.rpc("delete_my_account");
    if (result.error) { setError(result.error.message); setDeleting(false); return; }
    await signOut();
    window.location.href = "/";
  }

  if (!user) {
    return (
      <div className="settings-card">
        <h2>Login required</h2>
        <p>Sign in to edit your profile.</p>
        <Link className="primary-button" href="/auth">Login</Link>
      </div>
    );
  }

  return (
    <div className="settings-layout">
      <form className="settings-card upload-form" onSubmit={save}>
        <div>
          <p className="eyebrow">PROFILE CUSTOMIZATION</p>
          <h1>Edit your profile</h1>
          <p className="settings-subtitle">Shape how your creator page looks and feels.</p>
        </div>

        {/* Bio */}
        <label>
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            placeholder="Tell the community about your sound."
          />
        </label>

        {/* Images */}
        <div className="form-grid">
          <label>
            Profile picture
            <input
              className="media-file-input"
              type="file"
              accept="image/*"
              onChange={(e) => void uploadImage(e, "avatar")}
            />
            {uploading === "avatar" && <small>Uploading...</small>}
            <input
              className="url-input"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              type="url"
              placeholder="Or paste an image URL"
            />
          </label>
          <label>
            Banner image
            <input
              className="media-file-input"
              type="file"
              accept="image/*"
              onChange={(e) => void uploadImage(e, "banner")}
            />
            {uploading === "banner" && <small>Uploading...</small>}
            <input
              className="url-input"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              type="url"
              placeholder="Or paste an image URL"
            />
          </label>
        </div>

        {/* Dynamic links */}
        <div className="links-section">
          <div className="links-header">
            <span className="links-label">Links</span>
            <small className="links-hint">{links.length}/{MAX_LINKS}</small>
          </div>
          <div className="links-list">
            {links.map((link, index) => (
              <div className="link-row" key={index}>
                <input
                  className="link-label-input"
                  value={link.label}
                  onChange={(e) => updateLink(index, "label", e.target.value)}
                  placeholder="Label (e.g. Twitter)"
                  maxLength={32}
                />
                <input
                  className="url-input link-url-input"
                  value={link.url}
                  onChange={(e) => updateLink(index, "url", e.target.value)}
                  type="url"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  className="link-remove-button"
                  title="Remove link"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          {links.length < MAX_LINKS && (
            <button type="button" className="add-link-button" onClick={addLink}>
              <Plus size={14} /> Add link
            </button>
          )}
        </div>

        {/* Theme */}
        <label>
          Theme
          <select value={theme} onChange={(e) => setTheme(e.target.value as Profile["theme"])}>
            <option value="forest">Forest</option>
            <option value="midnight">Midnight</option>
            <option value="sunset">Sunset</option>
            <option value="mono">Mono</option>
          </select>
        </label>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <button className="primary-button" disabled={saving || Boolean(uploading)}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <section className="settings-card danger-zone">
        <p className="eyebrow">ACCOUNT</p>
        <h2>Delete account</h2>
        <p>This permanently removes your profile, MIDI uploads, likes, follows and comments.</p>
        <button
          className="danger-button"
          disabled={deleting}
          onClick={() => void deleteAccount()}
          type="button"
        >
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </section>
    </div>
  );
}
