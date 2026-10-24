import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { authenticateRequest } from "@/lib/chat-auth";

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const db = getAdminFirestore();
  if (!db) return NextResponse.json({ error: "Chat service is not configured." }, { status: 503 });
  const snapshot = await db.collection("chats").orderBy("updatedAt", "desc").limit(250).get();
  const chats = snapshot.docs.filter((doc) => user.isAdmin || doc.data().uid === user.uid).map((doc) => ({ id: doc.id, ...doc.data(), updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || null }));
  return NextResponse.json(chats);
}

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (!user || user.isAdmin) return NextResponse.json({ error: "Customer sign-in is required." }, { status: 401 });
  const db = getAdminFirestore();
  if (!db) return NextResponse.json({ error: "Chat service is not configured." }, { status: 503 });
  let body: { collectionId?: unknown; homeName?: unknown; price?: unknown; listingUrl?: unknown; customerName?: unknown; initialMessage?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid chat request." }, { status: 400 }); }
  if (typeof body.collectionId !== "string" || body.collectionId.length > 180 || typeof body.homeName !== "string" || body.homeName.length > 160) {
    return NextResponse.json({ error: "A valid home collection is required." }, { status: 400 });
  }
  const chatId = createHash("sha256").update(`${user.uid}:${body.collectionId}`).digest("hex");
  const ref = db.collection("chats").doc(chatId);
  const previous = await ref.get();
  if (previous.exists) return NextResponse.json({ id: chatId, existing: true });
  const openingMessage = typeof body.initialMessage === "string" ? body.initialMessage.trim().slice(0, 2000) : `Hi, I’m interested in ${body.homeName}. Could you share more details and help me with the next steps?`;
  const now = FieldValue.serverTimestamp();
  const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
  await ref.set({
    uid: user.uid,
    email: user.email,
    customerName: customerName || user.email.split("@")[0],
    collectionId: body.collectionId,
    homeName: body.homeName,
    price: typeof body.price === "string" ? body.price.slice(0, 80) : "Contact for pricing",
    listingUrl: typeof body.listingUrl === "string" ? body.listingUrl.slice(0, 500) : "",
    downPayment: null,
    createdAt: now,
    updatedAt: now,
    lastMessage: "Started a conversation about " + body.homeName,
    lastSender: "customer",
  });
  await ref.collection("messages").add({ uid: user.uid, sender: "customer", text: openingMessage, createdAt: now });
  return NextResponse.json({ id: chatId, existing: false }, { status: 201 });
}
