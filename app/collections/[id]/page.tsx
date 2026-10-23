import { Suspense } from "react";
import { CollectionRouteClient } from "@/components/collection-route-client";

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="catalog-loading"><span className="catalog-loader" /><p>Opening the home collection…</p></div>}><ResolvedCollectionPage params={params} /></Suspense>;
}

async function ResolvedCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CollectionRouteClient id={id} />;
}
