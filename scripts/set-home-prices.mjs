import { doc, getFirestore, writeBatch } from "firebase/firestore/lite";
import { initializeApp } from "firebase/app";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
if (Object.values(config).some((value) => !value)) throw new Error("Firebase environment configuration is incomplete.");

const app = initializeApp(config);
const db = getFirestore(app);
const prices = {
  utah: "$15,000",
  "aspire-summit": "$16,500",
  "american-freedom": "$17,500",
  "prime-pinnacle-135": "$20,000",
  "prime-2856h42p01": "$18,500",
};
const batch = writeBatch(db);
for (const [id, price] of Object.entries(prices)) batch.set(doc(db, "collections", id), { price }, { merge: true });
await batch.commit();
console.log(`Updated ${Object.keys(prices).length} home collection prices between $15,000 and $20,000.`);
