"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { browserLocalPersistence, createUserWithEmailAndPassword, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, updateProfile, type User } from "firebase/auth";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { ArrowLeft, ArrowUpRight, Home as HouseIcon, Plus } from "@/components/icons";
import { firebaseAuth } from "@/lib/firebase-auth-client";
import { firebaseApp } from "@/lib/firebase-public";
import { starterCollections, type Collection } from "@/lib/catalog";
import { SiteFooter } from "@/components/site-footer";

type Chat = { id: string; uid: string; email: string; customerName: string; collectionId: string; homeName: string; price: string; listingUrl: string; downPayment: number | null; lastMessage: string; lastSender: string; updatedAt: string | null };
type ChatMessage = { id: string; uid: string; sender: "admin" | "customer"; text: string; createdAt: string | null };
const ADMIN_EMAIL = "support@anthonymobilehomes.com";

function googleSignInError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "auth/unauthorized-domain") return "This website address is not authorized for Google sign-in. Add its domain under Firebase Authentication > Settings > Authorized domains.";
  if (code === "auth/operation-not-allowed") return "Google sign-in is disabled. Enable the Google provider under Firebase Authentication > Sign-in method.";
  if (code === "auth/network-request-failed") return "Google sign-in could not reach Firebase. Check your connection and try again.";
  return error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
}

export function CustomerAccount() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [redirectHandled, setRedirectHandled] = useState(false);
  const [collections, setCollections] = useState<Collection[]>(starterCollections);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [notificationOn, setNotificationOn] = useState(false);
  const [showPaymentChoices, setShowPaymentChoices] = useState(false);
  const [requestedCollectionId, setRequestedCollectionId] = useState("");
  const [requestDraft, setRequestDraft] = useState("");
  const [paymentChannel, setPaymentChannel] = useState<"whatsapp" | "email">("whatsapp");
  const selectedChat = chats.find((chat) => chat.id === selectedId) || null;

  const goToCustomerChat = useCallback(() => {
    if (firebaseAuth.currentUser?.email?.toLowerCase() === ADMIN_EMAIL) {
      router.replace("/admin");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get("chat");
    if (chatId) {
      router.replace(`/account?chat=${encodeURIComponent(chatId)}`);
      return;
    }
    const collectionId = requestedCollectionId || params.get("collectionId");
    router.replace(collectionId ? `/account?collectionId=${encodeURIComponent(collectionId)}` : "/account");
  }, [requestedCollectionId, router]);

  useEffect(() => onAuthStateChanged(firebaseAuth, (nextUser) => {
    setUser(nextUser);
    setAuthReady(true);
    if (nextUser) {
      // This also handles redirect sign-in completing after the initial
      // callback timeout; always leave the signed-out form once Firebase has
      // confirmed an authenticated session.
      setRedirectHandled(true);
      goToCustomerChat();
    }
  }), [goToCustomerChat]);
  useEffect(() => {
    void fetch("/api/collections", { cache: "no-store" }).then((response) => response.ok ? response.json() : starterCollections).then((data: Collection[]) => setCollections(data)).catch(() => undefined);
    const params = new URLSearchParams(window.location.search);
    setRequestedCollectionId(params.get("collectionId") || "");
    if (params.get("collectionId") === "general") { try { setRequestDraft(window.sessionStorage.getItem("anthony-contact-draft") || ""); window.sessionStorage.removeItem("anthony-contact-draft"); } catch { /* Draft message is optional. */ } }
    setSelectedId(params.get("chat") || "");
  }, []);

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const current = firebaseAuth.currentUser;
    if (!current) throw new Error("Please sign in to continue.");
    const token = await current.getIdToken();
    const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers } });
    const body = response.status === 204 ? "" : await response.text();
    let result: any = null;
    if (body) {
      try { result = JSON.parse(body); }
      catch {
        const contentType = response.headers.get("content-type") || "unknown content type";
        throw new Error(`Request to ${path} returned an invalid response (HTTP ${response.status}, ${contentType}).`);
      }
    }
    if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : `Request to ${path} failed (HTTP ${response.status}).`);
    return result;
  }, []);

  const loadChats = useCallback(async () => {
    try { setChats(await api("/api/chats", { cache: "no-store" }) as Chat[]); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not load conversations."); }
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    void getRedirectResult(firebaseAuth).then(async (result) => {
      if (cancelled) return;
      // Auth state can settle just after getRedirectResult resolves. Prefer the
      // credential result, then the restored Firebase session.
      const returnedUser = result?.user || firebaseAuth.currentUser;
      if (!returnedUser) return;
      if (returnedUser.email?.toLowerCase() === ADMIN_EMAIL) {
        router.replace("/admin");
        return;
      }
      setUser(returnedUser);
      if (result) {
        try {
          await api("/api/customers/profile", { method: "POST", body: JSON.stringify({ name: returnedUser.displayName || "" }) });
        } catch (error) {
          if (!cancelled) setNotice(error instanceof Error ? error.message : "Your Google account is signed in, but its customer profile could not be saved.");
        }
      }
      if (!cancelled) goToCustomerChat();
    }).catch((error) => {
      if (!cancelled) setNotice(googleSignInError(error));
    }).finally(() => {
      if (!cancelled) {
        // onAuthStateChanged is the source of truth for a redirect callback.
        // Wait briefly for Firebase persistence to restore before revealing
        // the signed-out form, which otherwise looks like a failed login.
        const restoredUser = firebaseAuth.currentUser;
        if (restoredUser) {
          setUser(restoredUser);
          setRedirectHandled(true);
          return;
        }
        const timeout = window.setTimeout(() => {
          if (!cancelled) setRedirectHandled(true);
        }, 1200);
        const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
          if (!nextUser) return;
          if (!cancelled) {
            setUser(nextUser);
            setRedirectHandled(true);
          }
          window.clearTimeout(timeout);
          unsubscribe();
        });
      }
    });
    return () => { cancelled = true; };
  }, [api, goToCustomerChat, router]);

  useEffect(() => {
    if (!user) { setChats([]); setMessages([]); setSelectedId(""); return; }
    void loadChats();
  }, [user, loadChats]);

  useEffect(() => {
    if (!user || selectedId || requestedCollectionId || !chats.length) return;
    const latest = chats[0];
    setSelectedId(latest.id);
    router.replace(`/account?chat=${encodeURIComponent(latest.id)}`);
  }, [user, selectedId, requestedCollectionId, chats, router]);

  useEffect(() => {
    if (!user || user.email?.toLowerCase() === ADMIN_EMAIL || !requestedCollectionId) return;
    const home = requestedCollectionId === "general"
      ? { id: "general", name: "General enquiry", price: "" }
      : collections.find((item) => item.id === requestedCollectionId);
    if (!home) return;
    let cancelled = false;
    void api("/api/chats", { method: "POST", body: JSON.stringify({ collectionId: home.id, homeName: home.name, price: home.price, listingUrl: home.id === "general" ? `${window.location.origin}/account` : `${window.location.origin}/collections/${encodeURIComponent(home.id)}`, customerName: user.displayName || name, initialMessage: requestDraft || undefined }) })
      .then(async (result: { id: string; existing?: boolean }) => { if (!cancelled) { if (result.existing && requestDraft) await api(`/api/chats/${result.id}/messages`, { method: "POST", body: JSON.stringify({ text: requestDraft }) }); setSelectedId(result.id); void loadChats(); setRequestedCollectionId(""); setRequestDraft(""); router.replace(`/account?chat=${result.id}`); } })
      .catch((error) => { if (!cancelled) setNotice(error instanceof Error ? error.message : "Could not start the conversation."); });
    return () => { cancelled = true; };
  }, [user, requestedCollectionId, collections, api, loadChats, router, name, requestDraft]);

  useEffect(() => {
    if (!user || !selectedId) { setMessages([]); return; }
    let cancelled = false;
    const load = async () => {
      try { const next = await api(`/api/chats/${selectedId}/messages`, { cache: "no-store" }) as ChatMessage[]; if (!cancelled) setMessages(next); }
      catch (error) { if (!cancelled) setNotice(error instanceof Error ? error.message : "Messages could not be loaded."); }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [user, selectedId, api]);

  useEffect(() => {
    if (!user || !selectedId) return;
    const element = document.querySelector(".chat-message-list");
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, user, selectedId]);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | undefined;
    void isSupported().then((supported) => {
      if (!supported) return;
      unsubscribe = onMessage(getMessaging(firebaseApp), () => { void loadChats(); });
    }).catch(() => undefined);
    return () => unsubscribe?.();
  }, [user, loadChats]);

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      let credential: { user: User };
      if (mode === "signup") {
        credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
        await credential.user.getIdToken(true);
      } else credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      setUser(credential.user); setPassword("");
      await api("/api/customers/profile", { method: "POST", body: JSON.stringify({ name: credential.user.displayName || name.trim() }) });
      goToCustomerChat();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Sign-in failed. Check your details and try again."); }
    finally { setBusy(false); }
  }

  async function googleSignIn() {
    setBusy(true); setNotice("");
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        const credential = await signInWithPopup(firebaseAuth, provider);
        if (credential.user.email?.toLowerCase() === ADMIN_EMAIL) {
          router.replace("/admin");
          return;
        }
        setUser(credential.user);
        await api("/api/customers/profile", { method: "POST", body: JSON.stringify({ name: credential.user.displayName || "" }) });
        setRedirectHandled(true);
        goToCustomerChat();
      } catch (popupError) {
        const code = typeof popupError === "object" && popupError && "code" in popupError ? String(popupError.code) : "";
        if (code !== "auth/popup-blocked" && code !== "auth/operation-not-supported-in-this-environment") throw popupError;
        await signInWithRedirect(firebaseAuth, provider);
      }
    } catch (error) { setNotice(googleSignInError(error)); }
    finally { setBusy(false); }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedChat || !message.trim()) return;
    const outgoing = message.trim(); setMessage(""); setBusy(true);
    try { await api(`/api/chats/${selectedChat.id}/messages`, { method: "POST", body: JSON.stringify({ text: outgoing }) }); await loadChats(); const next = await api(`/api/chats/${selectedChat.id}/messages`, { cache: "no-store" }) as ChatMessage[]; setMessages(next); }
    catch (error) { setMessage(outgoing); setNotice(error instanceof Error ? error.message : "Message could not be sent."); }
    finally { setBusy(false); }
  }

  async function enableNotifications() {
    setBusy(true); setNotice("");
    try {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) throw new Error("Web push isn");
      if (!(await isSupported())) throw new Error("This browser does not support web notifications.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications were not allowed in browser settings.");
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/firebase-messaging/" });
      const worker = registration.installing || registration.waiting || registration.active;
      if (!worker) throw new Error("The notification service worker could not be started. Reload this page and try again.");
      if (worker.state !== "activated") {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error("The notification service worker is taking too long to start. Reload this page and try again.")), 10000);
          const finish = (error?: Error) => {
            window.clearTimeout(timeout);
            worker.removeEventListener("statechange", onStateChange);
            error ? reject(error) : resolve();
          };
          const onStateChange = () => {
            if (worker.state === "activated") finish();
            else if (worker.state === "redundant") finish(new Error("The notification service worker failed to start. Reload this page and try again."));
          };
          worker.addEventListener("statechange", onStateChange);
          if (worker.state === "activated") finish();
        });
      }
      const token = await getToken(getMessaging(firebaseApp), { vapidKey, serviceWorkerRegistration: registration });
      if (!token) throw new Error("Could not create a notification subscription.");
      await api("/api/push-tokens", { method: "POST", body: JSON.stringify({ token }) });
      setNotificationOn(true); setNotice("Notifications are on for this device.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not enable notifications."); }
    finally { setBusy(false); }
  }

  async function startPayment(channel: "whatsapp" | "email") {
    if (!selectedChat || selectedChat.downPayment == null || selectedChat.downPayment <= 0) return;
    const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(selectedChat.downPayment);
    const listing = selectedChat.listingUrl || `${window.location.origin}/collections/${selectedChat.collectionId}`;
    const body = [`Hello Anthony Mobile Homes, I`, `Customer: ${user?.displayName || user?.email}`, `Home: ${selectedChat.homeName}`, `Home price: ${selectedChat.price}`, `Down payment: ${amount}`, `Listing: ${listing}`, `Conversation: ${window.location.origin}/account?chat=${selectedChat.id}`].join("\n");
    const url = channel === "whatsapp" ? `https://wa.me/17017139763?text=${encodeURIComponent(body)}` : `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(`Down payment: ${selectedChat.homeName}`)}&body=${encodeURIComponent(body)}`;
    window.open(url, channel === "whatsapp" ? "_blank" : "_self", "noopener,noreferrer");
  }

  const paymentLabel = useMemo(() => selectedChat?.downPayment != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(selectedChat.downPayment) : "", [selectedChat]);

  if (!authReady || !redirectHandled) return <main className="account-page"><div className="account-auth-loading" role="status">Checking your sign-in...</div></main>;

  async function switchToCustomerAccount() {
    setNotice("");
    setSelectedId("");
    await signOut(firebaseAuth);
  }

  if (user?.email?.toLowerCase() === ADMIN_EMAIL) return <main className="account-page"><header className="account-header"><Link href="/" className="wordmark"><span className="brand-house"><HouseIcon size={18}/></span><span>ANTHONY <b>MOBILE HOMES</b></span></Link><button type="button" className="account-signout" onClick={() => void signOut(firebaseAuth)}>Sign out</button></header><section className="account-admin-redirect"><p className="eyebrow">ADMIN ACCOUNT</p><h1>Open your dashboard</h1><p>Use the admin workspace to reply to customers and manage their down payments.</p><Link className="account-primary-link" href="/admin">Go to admin dashboard <ArrowUpRight size={16}/></Link>{requestedCollectionId && <><p>This enquiry needs a customer account. Switch accounts to continue; your selected home will stay here.</p><button className="account-primary-link" type="button" onClick={() => void switchToCustomerAccount()}>Switch to customer sign in</button></>}</section><SiteFooter/></main>;

  return <main className="account-page">
    <header className="account-header"><Link href="/" className="wordmark"><span className="brand-house"><HouseIcon size={18}/></span><span>ANTHONY <b>MOBILE HOMES</b></span></Link><nav><Link href="/collections">Explore homes</Link>{user ? <button type="button" className="account-signout" onClick={() => void signOut(firebaseAuth)}>Sign out</button> : <Link href="/account">Sign in</Link>}</nav></header>
    {!user ? <section className="account-auth-layout">
      <div className="account-auth-story"><p className="eyebrow light"><span className="eyebrow-line"/> YOUR NEXT CHAPTER</p><h1>Let’s find<br/><em>your place.</em></h1><p>Sign in to chat with our team, keep track of homes you’re interested in, and continue your conversation whenever you’re ready.</p><Link href="/collections">Explore home collections <ArrowUpRight size={16}/></Link></div>
      <form className="account-auth-card" onSubmit={authenticate}><p className="eyebrow"><span className="eyebrow-line"/> CUSTOMER ACCOUNT</p><h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2><p className="account-auth-caption">Your home search, and every conversation, in one place.</p><button type="button" className="google-signin" disabled={busy} onClick={() => void googleSignIn()}><span>G</span> Continue with Google</button><div className="account-or"><span/> or continue with email <span/></div>{mode === "signup" && <label>Your name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name"/></label>}<label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label><label>Password<input required type="password" minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters"/></label>{notice && <p className="account-notice" role="status">{notice}</p>}<button className="account-primary-button" type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button><p className="account-toggle">{mode === "signin" ? "New to Anthony Mobile Homes?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(""); }}>{mode === "signin" ? "Create account" : "Sign in"}</button></p><small className="account-privacy">Your account helps us keep your home enquiries and messages together.</small></form>
    </section> : <section className={"customer-messenger " + (selectedChat ? "has-chat" : "")}>
      <aside className="customer-chat-sidebar"><div className="customer-account-heading"><div><p className="eyebrow"><span className="eyebrow-line"/> YOUR ACCOUNT</p><h1>Hello{user.displayName ? ", " + user.displayName.split(" ")[0] : ""}.</h1><small>{user.email}</small></div><button type="button" aria-label="Sign out" title="Sign out" onClick={() => void signOut(firebaseAuth)}>Sign out</button></div><button type="button" className="notification-action" disabled={busy || notificationOn} onClick={() => void enableNotifications()}>{notificationOn ? "Notifications enabled" : "Enable message notifications"}</button><div className="customer-conversation-heading"><h2>Conversations</h2><span>{chats.length}</span></div><div className="customer-conversation-list">{chats.map((chat) => <button type="button" key={chat.id} className={"customer-conversation " + (selectedId === chat.id ? "is-active" : "")} onClick={() => { setSelectedId(chat.id); setShowPaymentChoices(false); router.replace("/account?chat=" + chat.id); }}><span className="conversation-home-icon"><HouseIcon size={16}/></span><span className="conversation-copy"><strong>{chat.homeName}</strong><small>{chat.lastMessage}</small></span><ArrowUpRight size={14}/></button>)}{!chats.length && <div className="conversation-empty"><span>H</span><strong>Your home search starts here</strong><p>Choose a collection and start a private conversation with our team.</p><Link href="/collections">Browse homes <ArrowUpRight size={14}/></Link></div>}</div></aside>
      <section className="customer-chat-main">{selectedChat ? <><header className="customer-chat-header"><button className="chat-back-mobile" type="button" onClick={() => { setSelectedId(""); router.replace("/account"); }}><ArrowLeft size={16}/> Conversations</button><div className="chat-home-cover" style={{ backgroundImage: `url("${collections.find((home) => home.id === selectedChat.collectionId)?.imageUrl || ""}")` }}/><div className="chat-home-title"><span>HOME ENQUIRY</span><h2>{selectedChat.homeName}</h2><small>{selectedChat.price}</small></div><Link href={"/collections/" + selectedChat.collectionId} className="chat-listing-link">View home <ArrowUpRight size={14}/></Link></header><div className="chat-intro-note"><span>H</span><p>Your conversation with the Anthony Mobile Homes team. We’ll reply here and notify your signed-in devices when we do.</p></div><div className="chat-message-list" aria-live="polite">{messages.map((item) => <article className={"chat-bubble " + (item.sender === "customer" ? "is-mine" : "is-admin")} key={item.id}><span>{item.sender === "admin" ? "ANTHONY MOBILE HOMES" : "YOU"}</span><p>{item.text}</p><time>{item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Sending..."}</time></article>)}</div>{selectedChat.downPayment != null && selectedChat.downPayment > 0 && <div className="downpayment-card"><div><span>DOWN PAYMENT SET BY YOUR HOME SPECIALIST</span><strong>{paymentLabel}</strong><small>Ready to discuss the next step? Choose how to continue with our team.</small></div><div className="downpayment-actions"><button type="button" className="downpayment-button" onClick={() => setShowPaymentChoices((open) => !open)}>Continue with down payment <ArrowUpRight size={15}/></button>{showPaymentChoices && <div className="downpayment-choices"><button type="button" onClick={() => void startPayment("whatsapp")}>Continue on WhatsApp <ArrowUpRight size={14}/></button><button type="button" onClick={() => void startPayment("email")}>Continue by email <ArrowUpRight size={14}/></button></div>}</div></div>}<form className="customer-message-form" onSubmit={sendMessage}><label htmlFor="customer-chat-message">Message our home specialist</label><div className="customer-message-compose"><textarea id="customer-chat-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={2} maxLength={2000} placeholder="Type your message here…"/><button type="submit" disabled={busy || !message.trim()}><span>{busy ? "Sending…" : "Send message"}</span><ArrowUpRight size={16}/></button></div></form></> : <div className="chat-welcome-state"><span className="chat-welcome-mark">A</span><p className="eyebrow">PERSONAL HOME GUIDANCE</p><h2>A good home search<br/><em>starts with a conversation.</em></h2><p>Choose a home you’re interested in and message our team here. Our home specialists will reply in this private chat.</p><button type="button" className="chat-start-button" onClick={() => { setNotice(""); setRequestedCollectionId("general"); }}>Start a conversation <ArrowUpRight size={17}/></button><Link href="/collections" className="chat-browse-link">Or browse home collections first</Link></div>}{notice && <div className="account-toast" role="status">{notice}<button type="button" onClick={() => setNotice("")}>X</button></div>}</section>
    </section>}
    {!user && <SiteFooter/>}
  </main>;
}

