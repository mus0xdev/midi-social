import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Contact | Midylo", description: "Contact Midylo about privacy, copyright, support or account questions." };

export default function ContactPage() {
  return <LegalPage eyebrow="GET IN TOUCH" title="Contact"><p>For general support, account questions or feedback, email <a href="mailto:mus0xdev@proton.me">mus0xdev@proton.me</a>.</p><p>For copyright notices, use <a href="mailto:mus0xdev@proton.me">mus0xdev@proton.me</a> and include the exact MIDI URL and details described on our <a href="/copyright">Copyright page</a>.</p><p>For privacy requests, email <a href="mailto:mus0xdev@proton.me">mus0xdev@proton.me</a>.</p></LegalPage>;
}
