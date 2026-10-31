"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BotIcon, X } from "@/components/icons";

type AssistantMessage = { id: number; from: "assistant" | "visitor"; text: string; link?: { label: string; href: string } };

const quickQuestions = ["How do I browse homes?", "Can you help with financing?", "How do I contact you?"];

function answerQuestion(question: string): Omit<AssistantMessage, "id" | "from"> {
  const text = question.toLowerCase();
  if (/\b(hi|hello|hey|good morning|good afternoon)\b/.test(text)) {
    return { text: "Hello! I can help you browse our homes, understand how to get started, and find the right next step." };
  }
  if (/\b(hour|hours|open|opening|close|closing|weekend|sunday|saturday)\b/.test(text)) {
    return { text: "Please call or text our team for current business hours and to arrange a convenient time to talk." };
  }
  if (/\b(where|location|address|directions|showroom|office)\b/.test(text)) {
    return { text: "Call or text our team and we’ll share the latest location details and help arrange a visit." };
  }
  if (/\b(contact|call|phone|text|number|speak|talk|team|admin|human|person)\b/.test(text)) {
    return { text: "Call or text Anthony Mobile Homes at +1 (701) 713-9763. We’ll be happy to help." };
  }
  if (/\b(types?|manufactured|mobile|modular|new|pre-owned|used)\b/.test(text)) {
    return { text: "We offer new and pre-owned homes. Browse the current collection to see the homes and details available on the site.", link: { label: "Browse homes", href: "/collections" } };
  }
  if (/\b(price|pricing|cost|financ|down payment|payment|deposit|loan)\b/.test(text)) {
    return { text: "Prices and payment options vary by home. Open a listing for its details, then message our team about pricing, financing, or down payment options.", link: { label: "Browse homes", href: "/collections" } };
  }
  if (/\b(delivery|deliver|transport|shipping|site|setup|install|move in|move-in|land|property)\b/.test(text)) {
    return { text: "Delivery and setup depend on the home and location. Call or text us with the home you’re interested in and where it would go." };
  }
  if (/\b(visit|tour|see|view)\b/.test(text)) {
    return { text: "Call or text us to ask about viewing a home and arranging a visit." };
  }
  if (/\b(home|homes|collection|floor plan|room|bedroom|listing|browse|available)\b/.test(text)) {
    return { text: "You can browse our current home collections and open any listing to see its details and rooms.", link: { label: "Browse homes", href: "/collections" } };
  }
  if (/\b(start|next step|buy|purchase|interested|help)\b/.test(text)) {
    return { text: "Browse the homes and message our team about one you like. We’ll help you understand its details and next steps.", link: { label: "Browse homes", href: "/collections" } };
  }
  return { text: "I may not have that detail, but our team can help. Call or text Anthony Mobile Homes at +1 (701) 713-9763." };
}

export function SiteChatAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { id: 0, from: "assistant", text: "Hi! I’m the Anthony Mobile Homes assistant. Ask me about our homes, pricing, financing, visits, or getting started." },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (pathname === "/account" || pathname.startsWith("/admin")) setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  if (pathname === "/account" || pathname.startsWith("/admin")) return null;

  function sendQuestion(question: string) {
    const clean = question.trim();
    if (!clean) return;
    const answer = answerQuestion(clean);
    setMessages((current) => [
      ...current,
      { id: nextId.current++, from: "visitor", text: clean },
      { id: nextId.current++, from: "assistant", ...answer },
    ]);
    setDraft("");
  }

  return <div className="site-assistant">
    {open && <section className="site-assistant-panel" role="dialog" aria-label="Anthony Mobile Homes chat assistant">
      <header className="site-assistant-header"><span className="site-assistant-avatar"><BotIcon size={21}/></span><span><strong>Home assistant</strong><small>Here to help you find answers</small></span><button type="button" onClick={() => setOpen(false)} aria-label="Close chat assistant"><X size={18}/></button></header>
      <div className="site-assistant-messages" ref={listRef} aria-live="polite">{messages.map((message) => <article key={message.id} className={`site-assistant-message is-${message.from}`}><p>{message.text}</p>{message.link && <Link href={message.link.href} onClick={() => setOpen(false)}>{message.link.label}</Link>}</article>)}</div>
      {messages.length === 1 && <div className="site-assistant-quick-questions">{quickQuestions.map((question) => <button key={question} type="button" onClick={() => sendQuestion(question)}>{question}</button>)}</div>}
      <form className="site-assistant-form" onSubmit={(event) => { event.preventDefault(); sendQuestion(draft); }}><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} aria-label="Ask a question" placeholder="Type your question…"/><button type="submit" disabled={!draft.trim()} aria-label="Send question">Send</button></form>
    </section>}
    <button type="button" className="site-assistant-launcher" aria-expanded={open} aria-label={open ? "Close chat assistant" : "Open chat assistant"} onClick={() => setOpen((value) => !value)}><BotIcon size={22}/><span>Ask us</span></button>
  </div>;
}
