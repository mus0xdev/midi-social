"use client";

import Link from "next/link";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { GENRES } from "@/lib/genres";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIDI_TYPES = new Set(["audio/midi", "audio/mid", "audio/x-midi", "application/octet-stream", ""]);

export function UploadForm() {
  const { user, restricted } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [genre, setGenre] = useState("");
  const [tone, setTone] = useState("");
  const [license, setLicense] = useState("CC BY 4.0");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!user) return setError("Please log in first.");
    if (restricted) return setError("Your account cannot upload while it is suspended or banned.");
    if (!file || !title.trim()) return setError("Choose a MIDI file and add a title.");
    if (!/\.(mid|midi)$/i.test(file.name) || (file.type !== "" && !MIDI_TYPES.has(file.type))) return setError("Only .mid and .midi files are accepted.");
    if (file.size > MAX_FILE_SIZE) return setError("The file must be smaller than 10 MB.");

    const header = new TextDecoder().decode(await file.slice(0, 4).arrayBuffer());
    if (header !== "MThd") return setError("The file does not contain a valid MIDI header.");

    setSaving(true);
    const extension = file.name.toLowerCase().endsWith(".midi") ? "midi" : "mid";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage.from("midi-files").upload(path, file, {
      contentType: "audio/midi",
      upsert: false,
    });
    if (upload.error) {
      setError(upload.error.message);
      setSaving(false);
      return;
    }

    const result = await supabase.from("midi_files").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      filename: file.name.replace(/[<>"']/g, ""),
      storage_path: path,
      tags: [genre.toLowerCase(), ...tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean)].filter(Boolean).filter((tag, index, values) => values.indexOf(tag) === index),
      tone: tone.trim() || null,
      license,
    });
    if (result.error) {
      await supabase.storage.from("midi-files").remove([path]);
      setError(result.error.message);
      setSaving(false);
      return;
    }
    setDone(true);
    setSaving(false);
  }

  if (done) {
    return <div className="success-panel"><CheckCircle2 size={36} /><h2>Your MIDI is live.</h2><p>The community can now discover, play and download it.</p><Link className="secondary-button" href="/">Back to library</Link></div>;
  }

  return <form className="upload-form" onSubmit={submit}>
    <label className="file-drop"><UploadCloud size={28} /><strong>{file ? file.name : "Drop your MIDI here"}</strong><span>{file ? `${(file.size / 1024).toFixed(0)} KB selected` : "or click to browse · .mid, .midi · max 10 MB"}</span><input type="file" accept=".mid,.midi,audio/midi" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
    <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Midnight Sketch" maxLength={120} /></label>
    <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should listeners know?" maxLength={2000} /></label>
    <div className="form-grid"><label>Genre<select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="">Select a genre</option>{GENRES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Key<input value={tone} onChange={(event) => setTone(event.target.value)} placeholder="C major, A minor" maxLength={32} /></label></div>
    <label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="piano, loop, cinematic" /></label>
    <p className="upload-policy">Only upload MIDI that you created, own, have permission to distribute, or that is genuinely Public Domain or licensed for redistribution.</p>
    <label>License<select value={license} onChange={(event) => setLicense(event.target.value)}><option>Public domain</option><option>CC0</option><option>CC BY 4.0</option><option>CC BY-SA 4.0</option><option>Creative Commons Attribution-ShareAlike 2.5</option><option>All Rights Reserved</option></select></label>
    {error && <p className="form-error">{error}</p>}
    <button className="primary-button" disabled={saving || restricted}>{restricted ? "Upload unavailable" : saving ? "Publishing..." : "Publish MIDI"}</button>
  </form>;
}
