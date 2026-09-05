"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { UploadForm } from "@/components/UploadForm";
import { useAuth } from "@/components/AuthProvider";
import { LoadingState } from "@/components/EmptyState";

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/auth"); }, [loading, user, router]);
  if (loading || !user) return <LoadingState />;
  return <><Navbar /><main className="content-shell narrow"><div className="page-heading"><p className="eyebrow">PUBLISH TO MIDYLO</p><h1>Upload a MIDI</h1><p>Put a new idea into the world.</p></div><UploadForm /></main></>;
}
