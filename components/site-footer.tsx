import Link from "next/link";
import { ArrowUpRight, Home } from "@/components/icons";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><Link href="/" className="wordmark"><span className="brand-house"><Home size={18} /></span><span>ANTHONY <b>MOBILE HOMES</b></span></Link><p>Find a home that fits your plans, your people, and your budget. We’re here to help you explore what comes next.</p><Link className="footer-whatsapp" href="/account">Chat with our team <ArrowUpRight size={15} /></Link></div>
      <div className="footer-column"><h2>Explore</h2><Link href="/">Home</Link><Link href="/collections">Home collections</Link><Link href="/account">My account & messages</Link><a href="/#about">About us</a><a href="/#process">How it works</a></div>
      <div className="footer-column"><h2>Get in touch</h2><a href="tel:+14702194472">+1 (470) 219-4472</a><Link href="/account">Message our team</Link><span>support@anthonymobilehomes.com</span><span>Anthony Mobile Homes</span></div>
    </div>
    <div className="footer-bottom"><span>© Anthony Mobile Homes</span><span>New and pre-owned homes · Financing options available</span></div>
  </footer>;
}
