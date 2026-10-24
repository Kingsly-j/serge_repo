"use client";

import { useRouter } from "next/navigation";
import type { Collection } from "@/lib/catalog";
import { ArrowUpRight } from "@/components/icons";

export function PurchaseButton({ collection, compact = false }: { collection: Collection; compact?: boolean }) {
  const router = useRouter();
  return <button type="button" className={`purchase-button${compact ? " purchase-button-compact" : ""}`} onClick={() => router.push(`/account?collectionId=${encodeURIComponent(collection.id)}`)}>
    Chat about this home <ArrowUpRight size={15} />
  </button>;
}
