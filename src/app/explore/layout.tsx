import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore MIDI | Midylo",
  description: "Discover popular, trending and top-rated MIDI files on Midylo.",
};

export default function ExploreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
