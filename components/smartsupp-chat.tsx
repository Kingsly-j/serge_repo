"use client";

import { useEffect } from "react";

export function SmartsuppChat() {
  useEffect(() => {
    const win = window as Window & { _smartsupp?: { key: string }; smartsupp?: { _: unknown[] } };
    win._smartsupp = { key: "7dd8537d0b3c5293033503fbed6f4b38e3447174" };
    win.smartsupp = win.smartsupp || { _: [] };
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.smartsuppchat.com/loader.js?";
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);
  return null;
}
