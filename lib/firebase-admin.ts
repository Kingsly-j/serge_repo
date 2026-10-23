import "server-only";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  let serviceAccount: ServiceAccount | null = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as Record<string, string>;
    serviceAccount = {
      projectId: parsed.projectId || parsed.project_id,
      clientEmail: parsed.clientEmail || parsed.client_email,
      privateKey: parsed.privateKey || parsed.private_key,
    };
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  if (!serviceAccount) return null;
  return getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
}

export function getAdminFirestore() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminAuth() {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}
