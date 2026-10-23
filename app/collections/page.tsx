"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Home as HouseIcon } from "@/components/icons";
import { starterCollections, type Collection } from "@/lib/catalog";
import { PurchaseButton } from "@/components/purchase-button";
import { SiteFooter } from "@/components/site-footer";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>(starterCollections);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/collections", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : starterCollections)
      .then((data: Collection[]) => setCollections(data))
      .catch(() => setCollections(starterCollections));
  }, []);

  const visible = useMemo(() => collections.filter((collection) =>
    `${collection.name} ${collection.subtitle} ${collection.description}`.toLowerCase().includes(query.toLowerCase().trim())
  ), [collections, query]);

  return <main className="anthony-site collection-browser">
    <div className="announcement">NEW &amp; PRE-OWNED HOMES <span>•</span> FINANCING OPTIONS <span>•</span> HERE TO HELP</div>
    <header className="site-header">
      <Link href="/" className="wordmark"><span className="brand-house"><HouseIcon size={18} /></span><span>ANTHONY <b>MOBILE HOMES</b></span></Link>
      <nav className="desktop-nav"><Link href="/">Home</Link><a href="tel:+17017139763">Talk with our team</a></nav>
      <a className="header-cta" href="tel:+17017139763">Call (701) 713-9763 <ArrowUpRight size={15} /></a>
    </header>
    <section className="catalog-hero">
      <div className="catalog-hero-photo" />
      <div className="catalog-hero-copy"><Link className="catalog-back" href="/"><ArrowLeft size={15} /> Back to home</Link><p className="eyebrow light"><span className="eyebrow-line" />Find a place that feels like yours</p><h1>Homes for the<br /><em>way you live.</em></h1><p>Explore our home collections and take a closer look at the rooms, layouts, and details inside.</p><a className="catalog-scroll" href="#collections">Explore the collections <ArrowRight size={15} /></a></div>
      <span className="catalog-image-credit">A closer look at home</span>
    </section>
    <section className="catalog-section" id="collections">
      <div className="catalog-heading"><div><p className="eyebrow"><span className="eyebrow-line" />Anthony Mobile Homes</p><h2>Explore our collections</h2><p>Browse home styles, then open a collection to see the living spaces inside.</p></div><label className="catalog-search"><span>Find a home</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search homes or builders" aria-label="Search home collections" /></label></div>
      <div className="catalog-results"><span>{visible.length} {visible.length === 1 ? "collection" : "collections"}</span><span>New &amp; pre-owned homes</span></div>
      {visible.length ? <div className="catalog-grid">{visible.map((collection, index) => <article className="catalog-card" key={collection.id} style={{ animationDelay: `${index * 90}ms` }}>
        <Link className="catalog-card-main" href={`/collections/${collection.id}`}>
          <div className="catalog-card-photo" style={{ backgroundImage: `url("${collection.imageUrl}")` }}><span className="catalog-card-index">HOME COLLECTION · {String(index + 1).padStart(2, "0")}</span><span className="catalog-card-open"><ArrowUpRight size={20} /></span><span className="catalog-photo-bottom">Explore the home <ArrowRight size={14} /></span></div>
          <div className="catalog-card-copy"><div><small>{collection.subtitle}</small><h3>{collection.name}</h3></div><span>{collection.rooms.length} interior spaces</span></div>
          <p>{collection.description}</p>
        </Link>
        <div className="catalog-card-purchase"><strong>{collection.price || "Contact for pricing"}</strong><PurchaseButton compact collection={collection} /></div>
      </article>)}</div> : <div className="catalog-empty"><h3>No matching collections</h3><p>Try another home name or builder.</p></div>}
      <p className="image-note">Model photos are for illustration. Ask Anthony Mobile Homes about current availability, specifications, and pricing.</p>
    </section>
    <section className="catalog-contact"><div><p className="eyebrow light"><span className="eyebrow-line" />Personal guidance from first look to move-in</p><h2>Let’s find a home<br /><em>that feels right.</em></h2></div><a href="tel:+17017139763">Talk with Anthony <ArrowUpRight size={17} /></a></section>
    <SiteFooter />
    <a className="whatsapp-float" href="https://wa.me/17017139763?text=Hello%20Anthony%20Mobile%20Homes%2C%20I%27m%20interested%20in%20your%20home%20collections." target="_blank" rel="noreferrer" aria-label="Chat with Anthony Mobile Homes on WhatsApp"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.3A12.6 12.6 0 0 0 5.2 22.4L3.5 28.7l6.5-1.7A12.7 12.7 0 1 0 16 3.3Zm0 22.9c-1.9 0-3.8-.5-5.4-1.6l-.4-.2-3.8 1 1-3.7-.3-.4a10.1 10.1 0 1 1 8.9 4.9Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.4.2-.7.1a8.3 8.3 0 0 1-2.5-1.5 9.3 9.3 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.8.6.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.4Z"/></svg><span>Chat with us</span></a>
  </main>;
}
