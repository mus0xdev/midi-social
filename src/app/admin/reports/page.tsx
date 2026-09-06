"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import type { ReportReason } from "@/types/database";

type ReportRow = { id: string; reporter_id: string; midi_id: string | null; comment_id: string | null; reason: ReportReason; description: string | null; status: "open" | "reviewed" | "dismissed"; created_at: string };
type ModerationProfile = { id: string; username: string; account_status: "active" | "suspended" | "banned" };

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profiles, setProfiles] = useState<ModerationProfile[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    supabase.from("profiles").select("is_admin").eq("id", user.id).single().then(({ data }) => {
      const isAdmin = Boolean((data as { is_admin?: boolean } | null)?.is_admin);
      setAllowed(isAdmin);
      if (!isAdmin) { setLoading(false); return; }
      Promise.all([supabase.from("reports").select("id, reporter_id, midi_id, comment_id, reason, description, status, created_at").order("created_at", { ascending: false }), supabase.from("profiles").select("id, username, account_status").order("username")]).then(([reportResult, profileResult]) => { setReports((reportResult.data as ReportRow[]) || []); setProfiles((profileResult.data as ModerationProfile[]) || []); setLoading(false); });
    });
  }, [authLoading, user]);

  async function updateStatus(id: string, status: ReportRow["status"]) {
    await supabase.from("reports").update({ status }).eq("id", id);
    setReports((items) => items.map((report) => report.id === id ? { ...report, status } : report));
  }

  async function updateAccountStatus(id: string, account_status: ModerationProfile["account_status"]) {
    const { error } = await supabase.from("profiles").update({ account_status }).eq("id", id);
    if (!error) setProfiles((items) => items.map((profile) => profile.id === id ? { ...profile, account_status } : profile));
  }

  if (authLoading || (user && loading)) return <><Navbar /><main className="content-shell"><LoadingState /></main></>;
  if (!user) return <><Navbar /><main className="content-shell"><EmptyState title="Login required" body="Sign in with an admin account to view reports." /></main></>;
  if (!allowed) return <><Navbar /><main className="content-shell"><EmptyState title="Admin access required" body="This page is available to moderators only." /></main></>;
  return <><Navbar /><main className="content-shell"><div className="page-heading"><p className="eyebrow">MODERATION</p><h1>Content reports</h1><p>Review reports and manage community accounts.</p></div><section className="moderation-section"><h2>Account moderation</h2>{profiles.length ? <div className="moderation-list">{profiles.map((profile) => <article className="moderation-row" key={profile.id}><strong>@{profile.username}</strong><select value={profile.account_status} onChange={(event) => void updateAccountStatus(profile.id, event.target.value as ModerationProfile["account_status"])} aria-label={`Status for ${profile.username}`}><option value="active">Active</option><option value="suspended">Suspend</option><option value="banned">Ban</option></select></article>)}</div> : <p>No profiles found.</p>}</section><section className="moderation-section"><h2>Content reports</h2>{reports.length ? <div className="admin-table">{reports.map((report) => <article className="report-row" key={report.id}><div><small>{report.reason}</small><p>{report.status}</p></div><div><small>{report.midi_id ? `MIDI: ${report.midi_id}` : `Comment: ${report.comment_id}`}</small><p>{report.description || "No additional details."}</p></div><select value={report.status} onChange={(event) => void updateStatus(report.id, event.target.value as ReportRow["status"])} aria-label="Report status"><option value="open">Open</option><option value="reviewed">Reviewed</option><option value="dismissed">Dismissed</option></select></article>)}</div> : <EmptyState title="No reports" body="The moderation queue is clear." />}</section></main></>;
}
