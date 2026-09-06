"use client";

import { Navbar } from "@/components/Navbar";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";

export default function SettingsPage() {
  return <><Navbar /><main className="content-shell settings-shell"><ProfileSettingsForm /></main></>;
}