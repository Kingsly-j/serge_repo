"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "anthony-site-visitor";
const ADMIN_KEY = "anthony-admin-session";

function visitorId() {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = window.crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function SiteTrafficTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try { if (window.sessionStorage.getItem(ADMIN_KEY)) return; } catch { /* Track normally when browser storage is unavailable. */ }
    const id = visitorId();
    if (!id) return;
    void fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId: id,
        path: pathname || "/",
        referrer: document.referrer,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      }),
    }).catch(() => undefined);
  }, [pathname]);
  return null;
}
