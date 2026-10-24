import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { authenticateRequest } from "@/lib/chat-auth";

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (!user || user.isAdmin) return NextResponse.json({ error: "Customer sign-in is required." }, { status: 401 });
  let body: { name?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid customer profile." }, { status: 400 }); }
  const displayName = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const db = getAdminFirestore();
  if (!db) return NextResponse.json({ error: "Customer account service is not configured." }, { status: 503 });
  await db.collection("customers").doc(user.uid).set({
    email: user.email,
    displayName,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return NextResponse.json({ saved: true });
}
