"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { MidiFile } from "@/types/database";

export function DeleteMidiButton({ midi }: { midi: MidiFile }) {
  const { user } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const userId = user?.id;
  if (!userId || userId !== midi.user_id) return null;

  async function removeMidi() {
    if (!window.confirm("Are you sure you want to delete this MIDI? This action cannot be undone.")) return;
    setDeleting(true);
    setError("");
    const storageResult = await supabase.storage.from("midi-files").remove([midi.storage_path]);
    if (storageResult.error) {
      setError(storageResult.error.message);
      setDeleting(false);
      return;
    }
    const databaseResult = await supabase.from("midi_files").delete().eq("id", midi.id).eq("user_id", userId);
    if (databaseResult.error) {
      setError(databaseResult.error.message);
      setDeleting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return <div className="delete-midi-action"><button className="danger-button" disabled={deleting} onClick={() => void removeMidi()}><Trash2 size={15} /> {deleting ? "Deleting..." : "Delete MIDI"}</button>{error && <span className="form-error">{error}</span>}</div>;
}