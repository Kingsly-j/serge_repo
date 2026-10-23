"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Home as HouseIcon } from "@/components/icons";
import { CollectionDetail } from "@/components/collection-detail";
import { starterCollections, type Collection } from "@/lib/catalog";
import { SiteFooter } from "@/components/site-footer";

export function CollectionRouteClient({ id }: { id: string }) {
  const [collections, setCollections] = useState<Collection[]>(starterCollections);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/collections", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : starterCollections)
      .then((data: Collection[]) => setCollections(data))
      .catch(() => setCollections(starterCollections))
      .finally(() => setLoaded(true));
  }, []);

  const collection = collections.find((item) => item.id === id);
  return <main className="anthony-site collection-detail-route">
    <div className="announcement">NEW &amp; PRE-OWNED HOMES <span>•</span> FINANCING OPTIONS <span>•</span> HERE TO HELP</div>
    <header className="site-header"><Link href="/" className="wordmark"><span className="brand-house"><HouseIcon size={18} /></span><span>ANTHONY <b>MOBILE HOMES</b></span></Link><nav className="desktop-nav"><Link href="/collections">Home collections</Link><a href="tel:+17017139763">Talk with our team</a></nav><a className="header-cta" href="tel:+17017139763">Call (701) 713-9763 <ArrowUpRight size={15} /></a></header>
    {collection ? <CollectionDetail collection={collection} onBack={() => { window.location.href = "/collections"; }} /> : loaded ? <div className="catalog-loading"><p>We couldn’t find that home collection.</p><Link href="/collections">Browse all home collections</Link></div> : <div className="catalog-loading"><span className="catalog-loader" /><p>Opening the home collection…</p></div>}
    <SiteFooter />
    <a className="whatsapp-float" href="https://wa.me/17017139763?text=Hello%20Anthony%20Mobile%20Homes%2C%20I%27m%20interested%20in%20your%20home%20collections." target="_blank" rel="noreferrer" aria-label="Chat with Anthony Mobile Homes on WhatsApp"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.3A12.6 12.6 0 0 0 5.2 22.4L3.5 28.7l6.5-1.7A12.7 12.7 0 1 0 16 3.3Zm0 22.9c-1.9 0-3.8-.5-5.4-1.6l-.4-.2-3.8 1 1-3.7-.3-.4a10.1 10.1 0 1 1 8.9 4.9Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.4.2-.7.1a8.3 8.3 0 0 1-2.5-1.5 9.3 9.3 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.8.6.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.4Z"/></svg><span>Chat with us</span></a>
  </main>;
}
