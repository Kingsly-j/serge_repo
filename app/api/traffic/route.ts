import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

const ADMIN_EMAIL = "support@anthonymobilehomes.com";
const rateWindow = new Map<string, { count: number; startedAt: number }>();

function authorizedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || new URL(origin).host === new URL(request.url).host;
}

async function requireAdmin(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return false;
  try {
    const auth = getAdminAuth();
    if (!auth) return false;
    const decoded = await auth.verifyIdToken(token);
    return decoded.email?.toLowerCase() === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  const db = getAdminFirestore();
  if (!db) return NextResponse.json({ error: "Firebase Admin credentials are not configured on the server." }, { status: 503 });

  const range = new URL(request.url).searchParams.get("range") || "30d";
  const durationMs = range === "24h" ? 24 * 60 * 60 * 1000 : range === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const start = now - durationMs;
  try {
    const snapshot = await db.collection("trafficEvents")
      .where("createdAt", ">=", Timestamp.fromMillis(start))
      .orderBy("createdAt", "desc")
      .limit(10000)
      .get();
    const events = snapshot.docs.map((entry) => entry.data());
    const visitors = new Set<string>();
    const pages = new Map<string, number>();
    const locations = new Map<string, number>();
    const bucketCount = range === "24h" ? 24 : range === "7d" ? 7 : 30;
    const bucketMs = durationMs / bucketCount;
    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      start: start + index * bucketMs,
      pageViews: 0,
      visitorIds: new Set<string>(),
    }));
    let edgeLocated = 0;
    for (const event of events) {
      const visitorId = typeof event.visitorId === "string" ? event.visitorId : "";
      const path = typeof event.path === "string" ? event.path : "/";
      const createdAt = event.createdAt instanceof Timestamp ? event.createdAt.toMillis() : now;
      if (visitorId) visitors.add(visitorId);
      pages.set(path, (pages.get(path) || 0) + 1);
      const location = event.location && typeof event.location === "object" ? event.location as Record<string, string> : {};
      const locationLabel = [location.city, location.region, location.country].filter(Boolean).join(", ") || location.timeZone || "Location unavailable";
      locations.set(locationLabel, (locations.get(locationLabel) || 0) + 1);
      if (location.source === "edge") edgeLocated++;
      const bucketIndex = Math.floor((createdAt - start) / bucketMs);
      if (bucketIndex >= 0 && bucketIndex < buckets.length) {
        buckets[bucketIndex].pageViews++;
        if (visitorId) buckets[bucketIndex].visitorIds.add(visitorId);
      }
    }
    return NextResponse.json({
      pageViews: events.length,
      uniqueVisitors: visitors.size,
      locations: [...locations].map(([label, count]) => ({ label, visits: count })).sort((a, b) => b.visits - a.visits).slice(0, 8),
      pages: [...pages].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 8),
      timeline: buckets.map((bucket) => ({
        label: range === "24h" ? new Date(bucket.start).toLocaleTimeString("en-US", { hour: "numeric" }) : range === "7d" ? new Date(bucket.start).toLocaleDateString("en-US", { weekday: "short" }) : new Date(bucket.start).toLocaleDateString("en-US", { day: "numeric" }),
        pageViews: bucket.pageViews,
        visitors: bucket.visitorIds.size,
      })),
      edgeLocated,
      locationCoverage: events.length ? Math.round((edgeLocated / events.length) * 100) : 0,
      capped: snapshot.size === 10000,
    });
  } catch (error) {
    console.error("Could not read site traffic", error);
    return NextResponse.json({ error: "Traffic data could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!authorizedOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = Date.now();
  const rate = rateWindow.get(forwarded);
  if (rate && current - rate.startedAt < 60_000 && rate.count >= 40) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  if (!rate || current - rate.startedAt >= 60_000) rateWindow.set(forwarded, { count: 1, startedAt: current });
  else rate.count++;
  if (rateWindow.size > 2000) for (const [key, item] of rateWindow) if (current - item.startedAt > 60_000) rateWindow.delete(key);

  const db = getAdminFirestore();
  if (!db) return NextResponse.json({ error: "Traffic collection is unavailable." }, { status: 503 });
  let body: { visitorId?: unknown; path?: unknown; referrer?: unknown; timeZone?: unknown; language?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.visitorId !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(body.visitorId) || typeof body.path !== "string" || !body.path.startsWith("/") || body.path.length > 180) {
    return NextResponse.json({ error: "Invalid traffic event." }, { status: 400 });
  }
  const headers = request.headers;
  const city = headers.get("x-vercel-ip-city") || headers.get("cf-ipcity") || "";
  const region = headers.get("x-vercel-ip-country-region") || headers.get("cf-region") || "";
  const country = headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "";
  const edgeLocation = Boolean(city || region || country);
  const location = {
    city: city.slice(0, 80),
    region: region.slice(0, 80),
    country: country.slice(0, 80),
    timeZone: typeof body.timeZone === "string" ? body.timeZone.slice(0, 80) : "",
    language: typeof body.language === "string" ? body.language.slice(0, 24) : "",
    source: edgeLocation ? "edge" : "browser",
  };
  try {
    await db.collection("trafficEvents").add({
      visitorId: body.visitorId,
      path: body.path,
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 300) : "",
      location,
      createdAt: Timestamp.now(),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Could not record site traffic", error);
    return NextResponse.json({ error: "Traffic event could not be recorded." }, { status: 503 });
  }
}
