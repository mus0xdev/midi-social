"use client";

import { Flag } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { ReportReason } from "@/types/database";

export function ReportButton({ midiId, commentId }: { midiId?: string; commentId?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const targetId = midiId || commentId;
  const userId = user?.id;

  if (!userId || !targetId) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await supabase.from("reports").insert({ reporter_id: userId, midi_id: midiId, comment_id: commentId, reason, description: details.trim() || null });
    if (result.error) {
      setMessage(result.error.code === "23505" ? "You have already reported this content." : result.error.message);
      return;
    }
    setMessage("Report submitted.");
    setDetails("");
    setOpen(false);
  }

  return <div className="report-control"><button className="report-button" title="Report content" onClick={() => setOpen((value) => !value)}><Flag size={14} /> Report</button>{open && <form className="report-form" onSubmit={submit}><select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} aria-label="Report reason"><option value="inappropriate">Inappropriate content</option><option value="copyright">Copyright concern</option><option value="spam">Spam</option><option value="other">Other</option></select><textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Additional details (optional)" maxLength={1000} /><button className="secondary-button" type="submit">Submit report</button></form>}{message && <span className="report-message">{message}</span>}</div>;
}
