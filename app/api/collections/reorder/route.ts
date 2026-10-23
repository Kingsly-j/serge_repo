import { NextResponse } from "next/server";
import { doc, writeBatch } from "firebase/firestore/lite";
import { publicFirestore } from "@/lib/firebase-public";

export async function POST(request: Request) {
  const body = (await request.json()) as { ids?: unknown };
  if (!Array.isArray(body.ids) || body.ids.some((id) => typeof id !== "string")) return NextResponse.json({ error: "A list of collection IDs is required." }, { status: 400 });
  const batch = writeBatch(publicFirestore);
  body.ids.forEach((id, index) => batch.set(doc(publicFirestore, "collections", id), { sortOrder: index, deleted: false, updatedAt: new Date().toISOString() }, { merge: true }));
  await batch.commit();
  return NextResponse.json({ saved: body.ids.length });
}
