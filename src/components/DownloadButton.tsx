"use client";
import { Download } from "lucide-react";
import type { MidiFile } from "@/types/database";
import { supabase } from "@/lib/supabase";
export function DownloadButton({ midi, compact = false }: { midi: MidiFile; compact?: boolean }) {
  async function download() { const { data } = supabase.storage.from("midi-files").getPublicUrl(midi.storage_path); await supabase.rpc("increment_midi_downloads", { midi_id: midi.id }); const link = document.createElement("a"); link.href = data.publicUrl; link.download = midi.filename; link.click(); }
  return <button className={compact ? "text-button" : "secondary-button"} onClick={() => void download()}><Download size={15} /> {compact ? "Save" : "Download MIDI"}</button>;
}