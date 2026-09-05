import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Copyright and DMCA | Midylo", description: "Report MIDI files that may infringe copyright on Midylo." };

export default function CopyrightPage() {
  return <LegalPage eyebrow="COPYRIGHT SUPPORT" title="Copyright / DMCA"><p className="legal-updated">Last updated: September 5, 2026</p><h2>Report a specific MIDI</h2><p>Open the MIDI detail page and use the <strong>Report</strong> button. Choose <strong>Copyright concern</strong> and include the MIDI URL, the work you believe is infringed, your relationship to the rights holder and any useful evidence.</p><p>You can also email a notice to <a href="mailto:mus0xdev@proton.me">mus0xdev@proton.me</a> with the subject “Copyright notice”.</p><h2>What to include</h2><p>Include your name and contact information, a description of the copyrighted work, the exact MIDI URL, a statement explaining why the upload is unauthorized, and a good-faith statement that the information is accurate.</p><h2>Review process</h2><p>We review complete reports and may temporarily restrict or remove reported content while investigating. We may contact the uploader, request more information or restore content when a claim is incomplete or disputed.</p><h2>Counter-notices</h2><p>If your content was removed and you believe that was an error, reply to the copyright notice or contact the address above with an explanation and evidence of your right to distribute the file.</p></LegalPage>;
}
