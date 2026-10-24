"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Home as HouseIcon, WhatsAppIcon } from "@/components/icons";
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
    <header className="site-header"><Link href="/" className="wordmark"><span className="brand-house"><HouseIcon size={18} /></span><span>ANTHONY <b>MOBILE HOMES</b></span></Link><nav className="desktop-nav"><Link href="/collections">Home collections</Link><a href="tel:+14702194472">Talk with our team</a><Link href="/account">My account</Link></nav><a className="header-cta" href="tel:+14702194472">Call (470) 219-4472 <ArrowUpRight size={15} /></a></header>
    {collection ? <CollectionDetail collection={collection} onBack={() => { window.location.href = "/collections"; }} /> : loaded ? <div className="catalog-loading"><p>We couldn?t find that home collection.</p><Link href="/collections">Browse all home collections</Link></div> : <div className="catalog-loading"><span className="catalog-loader" /><p>Opening the home collection?</p></div>}
    <SiteFooter />
    <a className="whatsapp-float" href="https://wa.me/17017139763?text=Hello%20Anthony%20Mobile%20Homes%2C%20I%27m%20interested%20in%20your%20homes." target="_blank" rel="noreferrer" aria-label="Inquire on WhatsApp at +1 701 713 9763"><WhatsAppIcon/><span>WhatsApp inquiry</span></a>
  </main>;
}
