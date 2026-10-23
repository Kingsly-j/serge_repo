import { NextResponse } from "next/server";
import { collection, doc, getDocs, setDoc } from "firebase/firestore/lite";
import { publicFirestore } from "@/lib/firebase-public";
import { starterReviews, type CustomerReview } from "@/lib/reviews";
import { validateReview } from "@/lib/review-validation";

type StoredReview = CustomerReview & { sortOrder?: number; createdAt?: string };

export async function GET() {
  let snapshot;
  try {
    snapshot = await getDocs(collection(publicFirestore, "reviews"));
  } catch (error) {
    console.error("Could not reach Firestore for reviews; serving sample reviews.", error);
    return NextResponse.json(starterReviews);
  }
  const reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StoredReview));
  reviews.sort((a, b) => {
    const aOrder = typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
  });
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<CustomerReview, "id">;
  const invalid = validateReview(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const ref = doc(collection(publicFirestore, "reviews"));
  await setDoc(ref, { name: body.name.trim(), location: body.location?.trim() ?? "", quote: body.quote.trim(), rating: body.rating, createdAt: new Date().toISOString() });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
