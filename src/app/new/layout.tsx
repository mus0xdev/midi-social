import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newest MIDI | Midylo",
  description: "Explore the newest MIDI files shared by the Midylo community.",
};

export default function NewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
