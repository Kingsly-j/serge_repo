import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Sign In | Anthony Mobile Homes",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <main className="admin-login-page"><div className="admin-login-page-card"><span className="admin-brand-mark">A</span><p className="eyebrow">PRIVATE WORKSPACE</p><h1>Admin sign in</h1><p>Sign in to manage home collections, customer chats, reviews, and site traffic. The sign-in form opens automatically.</p><Link href="/">Return to Anthony Mobile Homes</Link></div></main>;
}
