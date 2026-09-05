import Link from "next/link";

export function Footer() {
  return <footer className="site-footer"><span>© {new Date().getFullYear()} Midylo</span><div><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/copyright">Copyright</Link><Link href="/contact">Contact</Link></div></footer>;
}