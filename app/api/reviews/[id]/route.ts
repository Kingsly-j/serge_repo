import { NextResponse } from "next/server";
import { deleteDoc, doc, setDoc } from "firebase/firestore/lite";
import { publicFirestore } from "@/lib/firebase-public";
import { validateReview } from "@/lib/review-validation";
import type { CustomerReview } from "@/lib/reviews";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const body = (await request.json()) as Omit<CustomerReview, "id">;
  const invalid = validateReview(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const { id } = await context.params;
  await setDoc(doc(publicFirestore, "reviews", id), { name: body.name.trim(), location: body.location?.trim() ?? "", quote: body.quote.trim(), rating: body.rating, updatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ id });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  await deleteDoc(doc(publicFirestore, "reviews", id));
  return NextResponse.json({ id, deleted: true });
}
