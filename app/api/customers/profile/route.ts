import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { authenticateRequest } from "@/lib/chat-auth";
import { apiErrorResponse } from "@/lib/api-errors";

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user || user.isAdmin) return NextResponse.json({ error: "Customer sign-in is required." }, { status: 401 });
  try {
    const db = getAdminFirestore();
    if (!db) return NextResponse.json({ error: "Customer account service is not configured on the server." }, { status: 503 });
    const snapshot = await db.collection("customers").doc(user.uid).get();
    return NextResponse.json({ phone: typeof snapshot.data()?.phone === "string" ? snapshot.data()?.phone : "" });
  } catch (error) { return apiErrorResponse(error, "Loading customer profile"); }
}

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (!user || user.isAdmin) return NextResponse.json({ error: "Customer sign-in is required." }, { status: 401 });
  let body: { name?: unknown; phone?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid customer profile." }, { status: 400 }); }
  const displayName = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 32) : "";
  if (body.phone !== undefined && phone.replace(/\D/g, "").length < 7) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  try {
    const db = getAdminFirestore();
    if (!db) return NextResponse.json({ error: "Customer account service is not configured on the server." }, { status: 503 });
    await db.collection("customers").doc(user.uid).set({
      email: user.email,
      displayName,
      ...(phone ? { phone } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    if (phone) {
      const chats = await db.collection("chats").where("uid", "==", user.uid).get();
      const batch = db.batch();
      chats.docs.forEach((chat) => batch.update(chat.ref, { customerPhone: phone }));
      if (!chats.empty) await batch.commit();
    }
    return NextResponse.json({ saved: true });
  } catch (error) { return apiErrorResponse(error, "Saving customer profile"); }
}
