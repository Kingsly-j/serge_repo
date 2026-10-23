"use client";

import { useState } from "react";
import type { Collection } from "@/lib/catalog";
import { ArrowUpRight } from "@/components/icons";

export function PurchaseButton({ collection, compact = false }: { collection: Collection; compact?: boolean }) {
  const [choosing, setChoosing] = useState(false);
  const listingUrl = typeof window === "undefined" ? `/collections/${encodeURIComponent(collection.id)}` : `${window.location.origin}/collections/${encodeURIComponent(collection.id)}`;
  const message = [
    "Hello Anthony Mobile Homes, I would like to place an order inquiry for this home.",
    `Home: ${collection.name}`,
    `Price: ${collection.price || "Contact for pricing"}`,
    `Details: ${collection.description}`,
    `View this listing: ${listingUrl}`,
    "Please contact me about availability and the next steps to purchase.",
  ].join("\n");
  const whatsappUrl = `https://wa.me/17017139763?text=${encodeURIComponent(message)}`;
  const emailUrl = `mailto:support@anthonymobilehomes.com?subject=${encodeURIComponent(`Order inquiry: ${collection.name}`)}&body=${encodeURIComponent(message)}`;

  return <div className="purchase-action">
    <button type="button" className={`purchase-button${compact ? " purchase-button-compact" : ""}`} onClick={() => setChoosing((open) => !open)} aria-expanded={choosing}>
      Request to purchase <ArrowUpRight size={15} />
    </button>
    {choosing && <div className="purchase-choices" role="group" aria-label={`Choose how to inquire about ${collection.name}`}>
      <span>Choose how to contact us</span>
      <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => setChoosing(false)}>WhatsApp <ArrowUpRight size={14} /></a>
      <a href={emailUrl} onClick={() => setChoosing(false)}>Email <ArrowUpRight size={14} /></a>
    </div>}
  </div>;
}
