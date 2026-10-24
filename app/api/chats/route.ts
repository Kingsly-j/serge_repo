import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { authenticateRequest } from "@/lib/chat-auth";

function chatError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
  const message = error instanceof Error ? error.message : "Unknown Firestore error.";
  return { code, message: message.slice(0, 240) };
}

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  try {
    const db = getAdminFirestore();
    if (!db) return NextResponse.json({ error: "Chat service is not configured on the server." }, { status: 503 });
    const snapshot = await db.collection("chats").orderBy("updatedAt", "desc").limit(250).get();
    const chats = snapshot.docs
      .filter((entry) => user.isAdmin || entry.data().uid === user.uid)
      .map((entry) => ({ id: entry.id, ...entry.data(), updatedAt: entry.data().updatedAt?.toDate?.().toISOString() || null }));
    return NextResponse.json(chats);
  } catch (error) {
    const detail = chatError(error);
    console.error("Could not load customer chats", detail);
    return NextResponse.json({ error: `Chat service could not load conversations (${detail.code}): ${detail.message}` }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.isAdmin) return NextResponse.json({ error: "Customer sign-in is required." }, { status: 401 });
    let body: { collectionId?: unknown; homeName?: unknown; price?: unknown; listingUrl?: unknown; customerName?: unknown; initialMessage?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid chat request." }, { status: 400 }); }
    if (typeof body.collectionId !== "string" || body.collectionId.length > 180 || typeof body.homeName !== "string" || body.homeName.length > 160) {
      return NextResponse.json({ error: "A valid home collection is required." }, { status: 400 });
    }
    const db = getAdminFirestore();
    if (!db) return NextResponse.json({ error: "Chat service is not configured on the server." }, { status: 503 });
    const chatId = createHash("sha256").update(`${user.uid}:${body.collectionId}`).digest("hex");
    const chatRef = db.collection("chats").doc(chatId);
    const messageRef = chatRef.collection("messages").doc();
    const openingMessage = typeof body.initialMessage === "string"
      ? body.initialMessage.trim().slice(0, 2000)
      : `Hi, I’m interested in ${body.homeName}. Could you share more details and help me with the next steps?`;
    const now = FieldValue.serverTimestamp();
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";

    const outcome = await db.runTransaction(async (transaction) => {
      const previous = await transaction.get(chatRef);
      if (previous.exists) return { existing: true };
      transaction.set(chatRef, {
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
        lastMessage: `Started a conversation about ${body.homeName}`,
        lastSender: "customer",
      });
      transaction.set(messageRef, { uid: user.uid, sender: "customer", text: openingMessage, createdAt: now });
      return { existing: false };
    });
    return NextResponse.json({ id: chatId, ...outcome }, { status: outcome.existing ? 200 : 201 });
  } catch (error) {
    const detail = chatError(error);
    console.error("Could not start customer chat", detail);
    return NextResponse.json({ error: `Chat service could not start a conversation (${detail.code}): ${detail.message}` }, { status: 500 });
  }
}
