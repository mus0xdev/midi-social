import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search MIDI | Midylo",
  description: "Search MIDI files, creators and tags in the Midylo community.",
};

export default function SearchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
