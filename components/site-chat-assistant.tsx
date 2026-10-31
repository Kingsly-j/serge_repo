"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BotIcon, X } from "@/components/icons";

type AssistantMessage = { id: number; from: "assistant" | "visitor"; text: string; link?: { label: string; href: string }; whatsapp?: string };

const quickQuestions = ["How do I browse homes?", "Can you help with financing?", "How do I get started?"];

function answerQuestion(question: string): Omit<AssistantMessage, "id" | "from"> {
  const text = question.toLowerCase();
  if (/\b(hi|hello|hey|good morning|good afternoon)\b/.test(text)) {
    return { text: "Hello! I can help you browse our homes, understand how to get started, and find the right next step." };
  }
  if (/\b(home|homes|collection|floor plan|room|bedroom|listing|browse|available)\b/.test(text)) {
    return { text: "You can browse our current home collections and open any listing to see its details and rooms.", link: { label: "Browse homes", href: "/collections" } };
  }
  if (/\b(price|pricing|cost|financ|down payment|payment|deposit|loan)\b/.test(text)) {
    return { text: "Prices and payment options can vary by home. Open a home conversation to see any down payment set by our team, or ask an administrator if you need details for a specific home.", link: { label: "Message our team", href: "/account" } };
  }
  if (/\b(start|next step|buy|purchase|delivery|deliver|site|setup|move in|move-in)\b/.test(text)) {
    return { text: "Our team can guide you through the next steps for a specific home. Start a private conversation and include what you’d like to know.", link: { label: "Start a conversation", href: "/account" } };
  }
  const message = `Hello Anthony Mobile Homes, I need help with: ${question}`;
  return { text: "I couldn’t find a reliable answer to that here. You can contact an administrator on WhatsApp and include your question.", whatsapp: `https://wa.me/17017139763?text=${encodeURIComponent(message)}` };
}

export function SiteChatAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { id: 0, from: "assistant", text: "Hi! I’m the Anthony Mobile Homes assistant. Ask me about browsing homes or getting started." },
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
      <div className="site-assistant-messages" ref={listRef} aria-live="polite">{messages.map((message) => <article key={message.id} className={`site-assistant-message is-${message.from}`}><p>{message.text}</p>{message.link && <Link href={message.link.href} onClick={() => setOpen(false)}>{message.link.label}</Link>}{message.whatsapp && <a className="site-assistant-whatsapp" href={message.whatsapp} target="_blank" rel="noreferrer">Contact admin on WhatsApp ↗</a>}</article>)}</div>
      {messages.length === 1 && <div className="site-assistant-quick-questions">{quickQuestions.map((question) => <button key={question} type="button" onClick={() => sendQuestion(question)}>{question}</button>)}</div>}
      <form className="site-assistant-form" onSubmit={(event) => { event.preventDefault(); sendQuestion(draft); }}><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} aria-label="Ask a question" placeholder="Type your question…"/><button type="submit" disabled={!draft.trim()} aria-label="Send question">Send</button></form>
    </section>}
    <button type="button" className="site-assistant-launcher" aria-expanded={open} aria-label={open ? "Close chat assistant" : "Open chat assistant"} onClick={() => setOpen((value) => !value)}><BotIcon size={22}/><span>Ask us</span></button>
  </div>;
}
