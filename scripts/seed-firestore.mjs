import { initializeApp } from "firebase/app";
import { collection, doc, getDocs, getFirestore, writeBatch } from "firebase/firestore/lite";

const imageBase = "https://s7d9.scene7.com/is/image/championhomes/";
const home = (id, name, subtitle, description, image, rooms) => ({
  id, name, subtitle, description,
  imageUrl: `${imageBase}${image}`,
  rooms: rooms.map(([roomId, roomName, roomDescription, roomImage]) => ({
    id: roomId, name: roomName, description: roomDescription, imageUrl: `${imageBase}${roomImage}`,
  })),
});
const starterCollections = [
  home("utah", "Utah", "Regional Homes / Multi-section", "A spacious manufactured home with room to gather, a connected kitchen and living area, and options to personalize key spaces.", "Utah%20main%20image", [
    ["utah-living", "Living room", "An open living and dining area with an easy flow to the kitchen.", "Utah%20living%20room%20kitchen%20dining%20room"],
    ["utah-kitchen", "Kitchen", "A bright kitchen with an island and room for everyday meals.", "Utah%20kitchen"],
    ["utah-bedroom", "Bedroom", "A comfortable, light-filled retreat with a practical layout.", "Utah%20bedroom"],
  ]),
  home("aspire-summit", "Aspire Summit", "Dutch Housing / Multi-section", "A contemporary manufactured home with an inviting living room and customizable kitchen and bath options.", "112-aspire-2856h32a1c-summit-exterior-2", [
    ["summit-living", "Living room", "A generous central living space designed for relaxing together.", "112-aspire-2856h32a1c-summit-living-room-1"],
    ["summit-kitchen", "Kitchen", "A functional kitchen connected to the main living area.", "112-aspire-2856h32a1c-summit-kitchen-1"],
    ["summit-bedroom", "Primary bedroom", "A quiet bedroom with a comfortable, uncluttered feel.", "112-aspire-2856h32a1c-summit-primary-bedroom-1"],
  ]),
  home("american-freedom", "American Freedom 2848PC2", "Champion Homes / Multi-section", "A versatile manufactured home with a covered outdoor living area and a layout designed for everyday comfort.", "AF2848PC-2-exterior", [
    ["freedom-living", "Living room", "A welcoming main room with flexible space to make your own.", "AF2848PC-2-living-room-2"],
    ["freedom-kitchen", "Kitchen", "A practical open kitchen with a central island.", "AF2848PC-2-kitchen-2"],
    ["freedom-bedroom", "Primary bedroom", "A restful space with room for the essentials.", "AF2848PC-2-master-bed-1"],
  ]),
  home("prime-pinnacle-135", "Prime Pinnacle 135", "Champion Homes / Prime Multi-section", "A spacious five-bedroom home with an open kitchen, generous gathering spaces, and room to make it your own.", "135-prime-2876H-living-room-1", [
    ["pinnacle-living", "Living room", "A relaxed central living space with room for everyone.", "135-prime-2876H-living-room-2"],
    ["pinnacle-kitchen", "Kitchen", "A bright kitchen with generous everyday workspace.", "135-prime-2876H-kitchen-1"],
    ["pinnacle-dining", "Dining area", "A welcoming spot for family meals and gatherings.", "135-prime-2876H-dining-1"],
  ]),
  home("prime-2856h42p01", "Prime 2856H42P01", "Champion Homes / Prime Multi-section", "A thoughtfully planned four-bedroom home with an open kitchen and connected living and dining areas.", "P2856H42P01-Living-Room-1", [
    ["prime2856-living", "Living room", "A warm shared space with a natural flow to the kitchen.", "P2856H42P01-Living-Room-2"],
    ["prime2856-kitchen", "Kitchen", "An open kitchen designed to keep daily life connected.", "Prime-2856H42P01-Kitchen-1"],
    ["prime2856-dining", "Dining area", "A comfortable place to share meals and conversation.", "Prime-2856H42P01-Dining"],
  ]),
];

const examplePrices = {
  utah: "$15,000",
  "aspire-summit": "$16,500",
  "american-freedom": "$17,500",
  "prime-pinnacle-135": "$20,000",
  "prime-2856h42p01": "$18,500",
};
starterCollections.forEach((item) => { item.price = examplePrices[item.id]; });

const starterReviews = [
  { id: "sample-review-home-search", name: "Sample Customer", location: "Sample review — replace before launch", rating: 5, quote: "The team made it easy to compare layouts and understand which home could fit our needs. This is placeholder copy; replace it with a real customer review before publishing.", sortOrder: 1 },
  { id: "sample-review-guidance", name: "Sample Customer", location: "Sample review — replace before launch", rating: 5, quote: "We appreciated having the home details and room photos together while planning our next steps. This is placeholder copy; replace it with a real customer review before publishing.", sortOrder: 2 },
  { id: "sample-review-selection", name: "Sample Customer", location: "Sample review — replace before launch", rating: 5, quote: "The collection gave us a helpful starting point for exploring manufactured home options. This is placeholder copy; replace it with a real customer review before publishing.", sortOrder: 3 },
];

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing Firebase configuration: ${missing.join(", ")}`);
  process.exit(1);
}

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);
const existing = await getDocs(collection(db, "collections"));
const existingIds = new Set(existing.docs.map((snapshot) => snapshot.id));
const missingHomes = starterCollections.filter((home) => !existingIds.has(home.id));
const createdAt = new Date().toISOString();
const batch = writeBatch(db);
missingHomes.forEach((item, index) => {
  batch.set(doc(db, "collections", item.id), { ...item, sortOrder: index + 100, createdAt });
});
let updatedPrices = 0;
for (const item of starterCollections) {
  const saved = existing.docs.find((snapshot) => snapshot.id === item.id);
  if (saved && saved.data().price !== item.price) {
    batch.set(doc(db, "collections", item.id), { price: item.price, priceIsExample: true }, { merge: true });
    updatedPrices += 1;
  }
}

const existingReviews = await getDocs(collection(db, "reviews"));
const existingReviewIds = new Set(existingReviews.docs.map((snapshot) => snapshot.id));
const missingReviews = starterReviews.filter((review) => !existingReviewIds.has(review.id));
missingReviews.forEach((review) => batch.set(doc(db, "reviews", review.id), { ...review, createdAt, isExample: true }));

if (missingHomes.length || missingReviews.length || updatedPrices) await batch.commit();
console.log(`Added ${missingHomes.length} homes, set ${updatedPrices} example prices, and added ${missingReviews.length} clearly marked sample reviews.`);
