import { NextResponse } from "next/server";
import { deleteDoc, doc, setDoc } from "firebase/firestore/lite";
import { publicFirestore } from "@/lib/firebase-public";
import { starterCollections, type Collection } from "@/lib/catalog";

type Context = { params: Promise<{ id: string }> };

function validateCollection(body: Omit<Collection, "id">) {
  if (!body.name?.trim() || !body.imageUrl?.trim() || !body.description?.trim() || !body.price?.trim() || !Array.isArray(body.rooms)) {
    return "Name, description, price, cover image, and rooms are required.";
  }
  if (body.rooms.some((room) => !room.name?.trim() || !room.imageUrl?.trim())) return "Every room needs a name and photo.";
  return null;
}

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const body = (await request.json()) as Omit<Collection, "id">;
  const invalid = validateCollection(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  await setDoc(doc(publicFirestore, "collections", id), { ...body, deleted: false, updatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ id });
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  if (starterCollections.some((collection) => collection.id === id)) {
    await setDoc(doc(publicFirestore, "collections", id), { deleted: true, updatedAt: new Date().toISOString() }, { merge: true });
  } else {
    await deleteDoc(doc(publicFirestore, "collections", id));
  }
  return NextResponse.json({ id, deleted: true });
}
