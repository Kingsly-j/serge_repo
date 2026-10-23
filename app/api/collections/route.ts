import { NextResponse } from "next/server";
import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore/lite";
import { publicFirestore } from "@/lib/firebase-public";
import { starterCollections, type Collection } from "@/lib/catalog";

type StoredCollection = Collection & { deleted?: boolean; createdAt?: string };

export async function GET() {
  let snapshot;
  try {
    snapshot = await getDocs(collection(publicFirestore, "collections"));
  } catch (error) {
    console.error("Could not reach Firestore for collections; serving the editable starter catalog.", error);
    return NextResponse.json(starterCollections.map((item, index) => ({ ...item, sortOrder: index + 100, priceIsExample: true })));
  }
  if (snapshot.empty) {
    return NextResponse.json(starterCollections.map((item, index) => ({ ...item, sortOrder: index + 100 })));
  }

  const stored = new Map(snapshot.docs.map((entry) => [entry.id, { id: entry.id, ...entry.data() } as StoredCollection]));
  const defaults = starterCollections.flatMap((item, index) => {
    const saved = stored.get(item.id);
    if (saved?.deleted === true) return [];
    stored.delete(item.id);
    return [{ ...item, ...saved, sortOrder: typeof saved?.sortOrder === "number" ? saved.sortOrder : index + 100 }];
  });
  const custom = [...stored.values()].filter((item) => item.deleted !== true)
    .map((item) => ({ ...item, sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : 0 }));
  const ordered = [...custom, ...defaults].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  return NextResponse.json(ordered);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<Collection, "id">;
  const invalid = validateCollection(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const ref = doc(collection(publicFirestore, "collections"));
  await setDoc(ref, { ...body, sortOrder: 0, createdAt: new Date().toISOString() });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}

function validateCollection(body: Omit<Collection, "id">) {
  if (!body.name?.trim() || !body.imageUrl?.trim() || !body.description?.trim() || !body.price?.trim() || !Array.isArray(body.rooms)) {
    return "Name, description, price, cover image, and rooms are required.";
  }
  if (body.rooms.some((room) => !room.name?.trim() || !room.imageUrl?.trim())) return "Every room needs a name and photo.";
  return null;
}
