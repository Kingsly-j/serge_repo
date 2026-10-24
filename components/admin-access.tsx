"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { AdminPanel } from "@/components/admin-panel";
import { firebaseAuth } from "@/lib/firebase-auth-client";
import { starterCollections, type Collection } from "@/lib/catalog";
import { starterReviews, type CustomerReview } from "@/lib/reviews";

const ADMIN_EMAIL = "support@anthonymobilehomes.com";

export function AdminAccess() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [collections, setCollections] = useState<Collection[]>(starterCollections);
  const [reviews, setReviews] = useState<CustomerReview[]>(starterReviews);

  useEffect(() => onAuthStateChanged(firebaseAuth, (nextUser) => { setUser(nextUser); setAuthReady(true); }), []);
  useEffect(() => {
    if (!authReady || window.location.pathname !== "/admin") return;
    if (user) { setLoginOpen(false); setAdminOpen(true); }
    else setLoginOpen(true);
  }, [authReady, user]);

  useEffect(() => {
    let typed = "";
    let resetTimer: number | undefined;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if ((target instanceof Element && target.closest("input,textarea,select,[contenteditable=true]")) || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
        typed = "";
        return;
      }
      typed = `${typed}${event.key.toLowerCase()}`.slice(-5);
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => { typed = ""; }, 1800);
      if (typed === "admin") {
        typed = "";
        if (user) setAdminOpen(true);
        else setLoginOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(resetTimer);
    };
  }, [user]);

  async function refreshCatalog() {
    try {
      const [collectionsResponse, reviewsResponse] = await Promise.all([
        fetch("/api/collections", { cache: "no-store" }),
        fetch("/api/reviews", { cache: "no-store" }),
      ]);
      if (collectionsResponse.ok) setCollections(await collectionsResponse.json());
      if (reviewsResponse.ok) setReviews(await reviewsResponse.json());
    } catch { /* Keep the current catalog visible while offline. */ }
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, ADMIN_EMAIL, password);
      if (credential.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        try { window.sessionStorage.removeItem("anthony-admin-session"); } catch { /* Session storage is optional. */ }
    await signOut(firebaseAuth);
        throw new Error("This account is not authorized to manage the site.");
      }
      setUser(credential.user);
      try { window.sessionStorage.setItem("anthony-admin-session", "1"); } catch { /* Session storage is optional. */ }
      setPassword("");
      setLoginOpen(false);
      setAdminOpen(true);
      await refreshCatalog();
    } catch (loginError) {
      setError(loginError instanceof Error && loginError.message.includes("authorized") ? loginError.message : "Sign-in failed. Check the password and try again.");
    } finally { setBusy(false); }
  }

  async function logout() {
    try { window.sessionStorage.removeItem("anthony-admin-session"); } catch { /* Session storage is optional. */ }
    await signOut(firebaseAuth);
    setAdminOpen(false);
  }

  return <>
    {loginOpen && <div className="admin-login-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}>
      <form className="admin-login-box" onSubmit={login} aria-labelledby="admin-login-title">
        <button className="admin-login-close" type="button" onClick={() => setLoginOpen(false)} aria-label="Close admin sign in">X</button><p className="eyebrow"><span className="eyebrow-line" />Private access</p><h2 id="admin-login-title">Admin sign in</h2>
        <label>Email<input type="email" value={ADMIN_EMAIL} readOnly /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus required /></label>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Signing in" : "Sign in"}</button>
      </form>
    </div>}
    {adminOpen && user && <AdminPanel collections={collections} reviews={reviews} onClose={() => setAdminOpen(false)} onSaved={refreshCatalog} onSignOut={logout} />}
  </>;
}
