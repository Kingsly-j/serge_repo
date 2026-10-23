import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAccess } from "@/components/admin-access";
import { SiteTrafficTracker } from "@/components/site-traffic-tracker";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://anthonymobilehomes.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Anthony Mobile Homes | Find Your Next Home",
  description: "Explore new and used mobile homes, compare collections, and find the right home for you.",
  applicationName: "Anthony Mobile Homes",
  icons: {
    icon: "/anthony-mark.svg",
    shortcut: "/anthony-mark.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Anthony Mobile Homes",
    title: "Anthony Mobile Homes | Find Your Next Home",
    description: "Explore new and used mobile homes, compare collections, and find the right home for you.",
    images: [{ url: "/slogo.jpeg", width: 1280, height: 720, alt: "Anthony Mobile Homes — find your next home" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anthony Mobile Homes | Find Your Next Home",
    description: "Explore new and used mobile homes, compare collections, and find the right home for you.",
    images: ["/slogo.jpeg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}<AdminAccess /><Suspense fallback={null}><SiteTrafficTracker /></Suspense></body>
    </html>
  );
}
