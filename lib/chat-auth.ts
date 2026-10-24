import "server-only";
import { getAdminAuth } from "@/lib/firebase-admin";

export const ADMIN_EMAIL = "support@anthonymobilehomes.com";

export async function authenticateRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  try {
    const auth = getAdminAuth();
    if (!auth) return null;
    const decoded = await auth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase(),
      isAdmin: (decoded.email || "").toLowerCase() === ADMIN_EMAIL,
    };
  } catch {
    return null;
  }
}
