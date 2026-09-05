import { Navbar } from "@/components/Navbar";

export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <><Navbar /><main className="content-shell legal-shell"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="legal-content">{children}</div></main></>;
}