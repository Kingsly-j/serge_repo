import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { authenticateRequest } from "@/lib/chat-auth";
import { apiErrorResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (!user || user.isAdmin) return NextResponse.json({ error: "Customer sign-in is required." }, { status: 401 });
  let body: { token?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid notification token." }, { status: 400 }); }
  if (typeof body.token !== "string" || body.token.length < 40 || body.token.length > 4096) return NextResponse.json({ error: "Invalid notification token." }, { status: 400 });
  try {
    const db = getAdminFirestore();
    if (!db) return NextResponse.json({ error: "Notification service is not configured on the server." }, { status: 503 });
    const tokenId = createHash("sha256").update(body.token).digest("hex");
    await db.collection("customers").doc(user.uid).collection("pushTokens").doc(tokenId).set({ token: body.token, updatedAt: new Date() });
    return NextResponse.json({ saved: true });
  } catch (error) { return apiErrorResponse(error, "Saving notification subscription"); }
}
