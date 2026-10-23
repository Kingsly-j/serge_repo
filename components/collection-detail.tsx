"use client";

import { ArrowLeft, ArrowUpRight } from "@/components/icons";
import type { Collection } from "@/lib/catalog";
import { PurchaseButton } from "@/components/purchase-button";

export function CollectionDetail({ collection, onBack }: { collection: Collection; onBack: () => void }) {
  return <section className="detail-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> All collections</button>
    <div className="detail-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(24,26,21,.62),rgba(24,26,21,.05)),url("${collection.imageUrl}")` }}>
      <div><p className="eyebrow light"><span className="eyebrow-line" /> Anthony Mobile Homes</p><h1>{collection.name}<br /><em>{collection.subtitle}</em></h1><p>{collection.description}</p><strong className="detail-price">{collection.price || "Contact for pricing"}</strong><PurchaseButton collection={collection} /></div>
    </div>
    <div className="rooms-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> A closer look</p><h2>Spaces to make your own</h2></div><span>{collection.rooms.length} considered spaces</span></div>
    <div className="room-grid">{collection.rooms.map((room, i) => <article className="room-card" key={room.id}><div className="room-image" style={{ backgroundImage: `url("${room.imageUrl}")` }}><span>0{i + 1}</span></div><div className="room-info"><div><h3>{room.name}</h3><p>{room.description}</p></div><ArrowUpRight size={18} /></div></article>)}</div>
    <div className="detail-contact"><p>Could this be your next home?</p><a href="mailto:support@anthonymobilehomes.com">Let's talk <ArrowUpRight size={16} /></a><a href="tel:+17017139763">Call (701) 713-9763 <ArrowUpRight size={16} /></a><PurchaseButton collection={collection} /></div>
  </section>;
}
