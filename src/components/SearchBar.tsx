"use client";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBar({ large = false, defaultValue = "" }: { large?: boolean; defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue); const router = useRouter();
  function submit(event: FormEvent) { event.preventDefault(); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`); }
  return <form className={`search-bar ${large ? "search-large" : ""}`} onSubmit={submit}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tracks, creators, tags" aria-label="Search MIDI" /></form>;
}