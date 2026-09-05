"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import type { ReportReason } from "@/types/database";

type ReportRow = { id: string; reporter_id: string; midi_id: string | null; comment_id: string | null; reason: ReportReason; description: string | null; status: "open" | "reviewed" | "dismissed"; created_at: string };

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    supabase.from("profiles").select("is_admin").eq("id", user.id).single().then(({ data }) => {
      const isAdmin = Boolean((data as { is_admin?: boolean } | null)?.is_admin);
      setAllowed(isAdmin);
      if (!isAdmin) { setLoading(false); return; }
      supabase.from("reports").select("id, reporter_id, midi_id, comment_id, reason, description, status, created_at").order("created_at", { ascending: false }).then(({ data: rows }) => { setReports((rows as ReportRow[]) || []); setLoading(false); });
    });
  }, [authLoading, user]);

  async function updateStatus(id: string, status: ReportRow["status"]) {
    await supabase.from("reports").update({ status }).eq("id", id);
    setReports((items) => items.map((report) => report.id === id ? { ...report, status } : report));
  }

  if (authLoading || (user && loading)) return <><Navbar /><main className="content-shell"><LoadingState /></main></>;
  if (!user) return <><Navbar /><main className="content-shell"><EmptyState title="Login required" body="Sign in with an admin account to view reports." /></main></>;
  if (!allowed) return <><Navbar /><main className="content-shell"><EmptyState title="Admin access required" body="This page is available to moderators only." /></main></>;
  return <><Navbar /><main className="content-shell"><div className="page-heading"><p className="eyebrow">MODERATION</p><h1>Content reports</h1><p>Review reports submitted by the community.</p></div>{reports.length ? <div className="admin-table">{reports.map((report) => <article className="report-row" key={report.id}><div><small>{report.reason}</small><p>{report.status}</p></div><div><small>{report.midi_id ? `MIDI: ${report.midi_id}` : `Comment: ${report.comment_id}`}</small><p>{report.description || "No additional details."}</p></div><select value={report.status} onChange={(event) => void updateStatus(report.id, event.target.value as ReportRow["status"])} aria-label="Report status"><option value="open">Open</option><option value="reviewed">Reviewed</option><option value="dismissed">Dismissed</option></select></article>)}</div> : <EmptyState title="No reports" body="The moderation queue is clear." />}</main></>;
}
