import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { authenticateRequest } from "@/lib/chat-auth";
import { apiErrorResponse } from "@/lib/api-errors";

type Context = { params: Promise<{ chatId: string }> };

async function access(request: Request, chatId: string) {
  const user = await authenticateRequest(request);
  if (!user) return { response: NextResponse.json({ error: "Sign in is required." }, { status: 401 }) };
  const db = getAdminFirestore();
  if (!db) return { response: NextResponse.json({ error: "Chat service is not configured." }, { status: 503 }) };
  const ref = db.collection("chats").doc(chatId);
  const chat = await ref.get();
  if (!chat.exists || (!user.isAdmin && chat.data()?.uid !== user.uid)) return { response: NextResponse.json({ error: "Conversation not found." }, { status: 404 }) };
  return { user, db, ref, data: chat.data()! };
}

export async function GET(request: Request, { params }: Context) {
  try {
    const { chatId } = await params;
    const result = await access(request, chatId);
    if ("response" in result) return result.response;
    const snapshot = await result.ref.collection("messages").orderBy("createdAt", "asc").limitToLast(150).get();
    return NextResponse.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.().toISOString() || null })));
  } catch (error) { return apiErrorResponse(error, "Loading chat messages"); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { chatId } = await params;
    const result = await access(request, chatId);
    if ("response" in result) return result.response;
    let body: { text?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid message." }, { status: 400 }); }
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text || text.length > 2000) return NextResponse.json({ error: "Messages must be between 1 and 2,000 characters." }, { status: 400 });
    const sender = result.user.isAdmin ? "admin" : "customer";
    const now = FieldValue.serverTimestamp();
    const preview = text.length > 160 ? `${text.slice(0, 157)}...` : text;
    await result.db.runTransaction(async (transaction) => {
      const messageRef = result.ref.collection("messages").doc();
      transaction.set(messageRef, { uid: result.user.uid, sender, text, createdAt: now });
      transaction.update(result.ref, { lastMessage: preview, lastSender: sender, updatedAt: now });
    });
    if (sender === "admin") {
      try {
        const tokens = await result.db.collection("customers").doc(result.data.uid).collection("pushTokens").get();
        const values = tokens.docs.map((token) => token.data().token).filter((token): token is string => typeof token === "string");
        if (values.length) {
          const response = await getMessaging().sendEachForMulticast({
            tokens: values,
            notification: { title: "New message from Anthony Mobile Homes", body: preview },
            data: { chatId, url: `/account?chat=${chatId}` },
            webpush: { fcmOptions: { link: `/account?chat=${chatId}` } },
          });
          await Promise.all(response.responses.map((item, index) => item.error?.code === "messaging/registration-token-not-registered" ? tokens.docs[index].ref.delete() : Promise.resolve()));
        }
      } catch (error) { console.error("Could not send customer chat notification", error); }
    }
    return NextResponse.json({ sent: true }, { status: 201 });
  } catch (error) { return apiErrorResponse(error, "Sending chat message"); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { chatId } = await params;
    const result = await access(request, chatId);
    if ("response" in result) return result.response;
    if (!result.user.isAdmin) return NextResponse.json({ error: "Only the admin can set a down payment." }, { status: 403 });
    let body: { downPayment?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid down payment." }, { status: 400 }); }
    const amount = Number(body.downPayment);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1000000) return NextResponse.json({ error: "Enter a valid down payment amount." }, { status: 400 });
    await result.ref.update({ downPayment: amount, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ downPayment: amount });
  } catch (error) { return apiErrorResponse(error, "Updating chat down payment"); }
}
