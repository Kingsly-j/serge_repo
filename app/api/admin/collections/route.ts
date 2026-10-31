import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore/lite";
import { publicFirestore } from "@/lib/firebase-public";
import { apiErrorResponse } from "@/lib/api-errors";
import type { Collection } from "@/lib/catalog";
import { authenticateRequest } from "@/lib/chat-auth";

type StoredCollection = Collection & { deleted?: boolean; createdAt?: string };

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  try {
    const snapshot = await getDocs(collection(publicFirestore, "collections"));
    const collections = snapshot.docs
      .map((entry) => ({ id: entry.id, ...entry.data() }) as StoredCollection)
      .filter((item) => item.deleted !== true)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    return NextResponse.json(collections);
  } catch (error) {
    return apiErrorResponse(error, "Loading admin collections");
  }
}
