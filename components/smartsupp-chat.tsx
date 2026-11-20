"use client";

import { useEffect } from "react";

export function SmartsuppChat() {
  useEffect(() => {
    const win = window as Window & {
      _smartsupp?: { key: string };
      smartsupp?: ((...args: unknown[]) => void) & { _: unknown[] };
    };
    win._smartsupp = win._smartsupp || { key: "bd3b70a87ebaa3f61423fde90e20ce414a5aecd7" };
    win._smartsupp.key = "bd3b70a87ebaa3f61423fde90e20ce414a5aecd7";
    if (win.smartsupp) return;

    const smartsupp = ((...args: unknown[]) => { smartsupp._.push(args); }) as ((...args: unknown[]) => void) & { _: unknown[] };
    smartsupp._ = [];
    win.smartsupp = smartsupp;
    const firstScript = document.getElementsByTagName("script")[0];
    if (!firstScript?.parentNode) return;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.charset = "utf-8";
    script.async = true;
    script.src = "https://www.smartsuppchat.com/loader.js?";
    firstScript.parentNode.insertBefore(script, firstScript);
  }, []);
  return null;
}
