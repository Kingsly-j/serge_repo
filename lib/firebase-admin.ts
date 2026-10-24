import "server-only";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const appName = "anthony-mobile-homes-admin";
  const existing = getApps().find((app) => app.name === appName);
  if (existing) return existing;

  const expectedProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "serge-dcacd";
  let serviceAccount: ServiceAccount | null = null;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
      const parsed = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) as Record<string, string>;
      serviceAccount = {
        projectId: parsed.projectId || parsed.project_id || expectedProjectId,
        clientEmail: parsed.clientEmail || parsed.client_email,
        privateKey: (parsed.privateKey || parsed.private_key || "").replace(/\\n/g, "\n"),
      };
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        projectId: expectedProjectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/^\"|\"$/g, ""),
      };
    }
  } catch (error) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON is invalid: ${error instanceof Error ? error.message : "could not parse JSON"}`);
  }
  if (!serviceAccount?.clientEmail || !serviceAccount.privateKey) return null;
  if (serviceAccount.projectId !== expectedProjectId) {
    throw new Error(`Firebase Admin project mismatch: expected ${expectedProjectId}, received ${serviceAccount.projectId}.`);
  }
  return initializeApp({ credential: cert(serviceAccount), projectId: expectedProjectId }, appName);
}

export function getAdminFirestore() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminAuth() {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}
