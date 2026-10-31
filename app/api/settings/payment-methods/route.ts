import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/chat-auth";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { normalizePaymentMethods, PAYMENT_METHODS_DOCUMENT } from "@/lib/payment-methods";

export async function GET() {
  try {
    const db = getAdminFirestore();
    if (!db) return NextResponse.json({ methods: [] });
    const snapshot = await db.collection(PAYMENT_METHODS_DOCUMENT.collection).doc(PAYMENT_METHODS_DOCUMENT.id).get();
    return NextResponse.json({ methods: normalizePaymentMethods(snapshot.data()?.methods) });
  } catch (error) {
    console.error("Could not load payment methods", error);
    return NextResponse.json({ error: "Payment methods could not be loaded." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const user = await authenticateRequest(request);
  if (!user?.isAdmin) return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });

  let body: { methods?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid payment methods request." }, { status: 400 }); }
  if (!Array.isArray(body.methods) || body.methods.length > 20 || body.methods.some((item) => typeof item !== "string" || item.trim().length > 80)) {
    return NextResponse.json({ error: "Enter up to 20 payment methods, each no longer than 80 characters." }, { status: 400 });
  }

  const db = getAdminFirestore();
  if (!db) return NextResponse.json({ error: "Payment settings are not configured on the server." }, { status: 503 });
  const methods = normalizePaymentMethods(body.methods);
  try {
    await db.collection(PAYMENT_METHODS_DOCUMENT.collection).doc(PAYMENT_METHODS_DOCUMENT.id).set({ methods, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ methods });
  } catch (error) {
    console.error("Could not save payment methods", error);
    return NextResponse.json({ error: "Payment methods could not be saved." }, { status: 500 });
  }
}
