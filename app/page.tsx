"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Home as HouseIcon, Menu, WhatsAppIcon, X } from "@/components/icons";
import { starterCollections, type Collection } from "@/lib/catalog";
import { CollectionDetail } from "@/components/collection-detail";
import { ReviewsSection } from "@/components/reviews-section";
import { starterReviews, type CustomerReview } from "@/lib/reviews";
import { SiteFooter } from "@/components/site-footer";

const heroSlides = [
  { image: "https://s7d9.scene7.com/is/image/championhomes/Utah%20main%20image", eyebrow: "Manufactured homes made for living", title: "Room to live.", accent: "Space to grow.", note: "Explore homes built around your life" },
  { image: "https://s7d9.scene7.com/is/image/championhomes/112-aspire-2856h32a1c-summit-exterior-2", eyebrow: "New and pre-owned homes", title: "Find the one", accent: "that feels like home.", note: "Browse a range of home styles" },
  { image: "https://s7d9.scene7.com/is/image/championhomes/AF2848PC-2-exterior", eyebrow: "Guidance from first look to move-in", title: "Your next chapter", accent: "starts here.", note: "Let our team help you get started" },
  { image: "https://s7d9.scene7.com/is/image/championhomes/135-prime-2876H-living-room-1", eyebrow: "Discover a place of your own", title: "A little more room", accent: "for what matters.", note: "Find a layout made around your life" },
  { image: "https://s7d9.scene7.com/is/image/championhomes/P2856H42P01-Living-Room-1", eyebrow: "A home for all of life's moments", title: "Make space", accent: "for what is next.", note: "Explore inviting spaces and thoughtful layouts" },
];

const buyingSteps = [
  { number: "01", title: "Explore", copy: "Browse home styles and floor plans to find the right fit for your life and budget." },
  { number: "02", title: "Make it yours", copy: "Choose the layout, finishes, and features that make your new home feel like you." },
  { number: "03", title: "Plan your purchase", copy: "Talk with our team about pricing, financing options, site preparation, and delivery." },
  { number: "04", title: "Move in", copy: "We will help coordinate the next steps so you can get settled and feel at home." },
];

export default function Home() {
  const [collections, setCollections] = useState<Collection[]>(starterCollections);
  const [reviews, setReviews] = useState<CustomerReview[]>(starterReviews);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const homesRail = useRef<HTMLDivElement>(null);
  const spacesRail = useRef<HTMLDivElement>(null);

  async function refreshCollections() {
    try {
      const response = await fetch("/api/collections", { cache: "no-store" });
      if (response.ok) setCollections(await response.json());
    } catch { /* Keep the sample catalog available while offline. */ }
  }

  async function refreshReviews() {
    try {
      const response = await fetch("/api/reviews", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setReviews(Array.isArray(data) && data.length ? data : starterReviews);
      }
    } catch { /* Keep preview reviews visible while offline. */ }
  }

  async function refreshCatalog() { await Promise.all([refreshCollections(), refreshReviews()]); }

  function requestCall(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = `Hello, I’d like to request a call.\nName: ${form.get("name")}\nEmail: ${form.get("email")}\nPhone: ${form.get("phone")}\nPreferred day: ${form.get("day")}\nPreferred time: ${form.get("time")}\nMessage: ${form.get("message") || "No additional details"}`;
    try { window.sessionStorage.setItem("anthony-contact-draft", body); } catch { /* The customer can still start a general chat without the draft. */ }
    window.location.href = "/account?collectionId=general";
  }

  useEffect(() => {
    void refreshCatalog();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setSlideIndex((index) => (index + 1) % heroSlides.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12, rootMargin: "0px 0px -45px 0px" });
    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [selected, collections.length]);

  const moveSlide = (step: number) => setSlideIndex((index) => (index + step + heroSlides.length) % heroSlides.length);
  const scrollRail = (rail: React.RefObject<HTMLDivElement | null>, direction: number) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * 0.78, behavior: "smooth" });
  const spaces = collections[0]?.rooms ?? [];

  return (
    <main className="anthony-site">
      <div className="announcement">NEW &amp; PRE-OWNED HOMES <span>•</span> FINANCING OPTIONS <span>•</span> HERE TO HELP</div>
      <header className="site-header">
        <a href="#home" className="wordmark" onClick={() => setSelected(null)}><span className="brand-house"><HouseIcon size={18} /></span><span>ANTHONY <b>MOBILE HOMES</b></span></a>
        <nav className="desktop-nav"><Link href="/collections">Explore homes</Link><a href="#process">How it works</a><a href="#about">About us</a><Link href="/account">My account</Link></nav>
        <a className="header-cta" href="tel:+14702194472">Call (470) 219-4472 <ArrowUpRight size={15} /></a>
        <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>
      {menuOpen && <nav className="mobile-nav"><Link onClick={() => setMenuOpen(false)} href="/collections">Explore homes</Link><a onClick={() => setMenuOpen(false)} href="#process">How it works</a><a onClick={() => setMenuOpen(false)} href="#about">About us</a><Link onClick={() => setMenuOpen(false)} href="/account">My account</Link><a href="tel:+14702194472">Call Anthony</a></nav>}

      {selected ? <CollectionDetail collection={selected} onBack={() => setSelected(null)} /> : <>
        <section className="hero showcase-hero" id="home">
          <div className="hero-image" key={heroSlides[slideIndex].image} style={{ backgroundImage: `url("${heroSlides[slideIndex].image}")` }} />
          <div className="hero-shade" />
          <div className="hero-content"><div className="eyebrow light"><span className="eyebrow-line" />{heroSlides[slideIndex].eyebrow}</div><h1 key={heroSlides[slideIndex].title} className="slide-copy">{heroSlides[slideIndex].title}<br /><em>{heroSlides[slideIndex].accent}</em></h1><p>{heroSlides[slideIndex].note}. Find a home that fits your plans, your people, and your budget.</p><div className="hero-actions"><Link className="hero-link filled-link" href="/collections">Explore homes <ArrowDown size={16} /></Link><a className="hero-secondary" href="#contact">Talk with our team <ArrowUpRight size={15} /></a></div></div>
          <div className="hero-controls"><button aria-label="Previous slide" onClick={() => moveSlide(-1)}><ArrowLeft size={17} /></button><div className="hero-dots">{heroSlides.map((slide, index) => <button key={slide.title} aria-label={`Show slide ${index + 1}`} aria-current={slideIndex === index} onClick={() => setSlideIndex(index)}><span /></button>)}</div><button aria-label="Next slide" onClick={() => moveSlide(1)}><ArrowRight size={17} /></button></div>
          <div className="hero-note"><span>0{slideIndex + 1} / 0{heroSlides.length}</span><span>Anthony Mobile Homes - Find your next home</span></div>
        </section>

        <section className="brand-promo" aria-label="Meet Anthony Mobile Homes" data-reveal>
          <div className="brand-promo-content">
            <div className="brand-promo-copy"><p className="eyebrow"><span className="eyebrow-line" />A better way to find home</p><h2>Your next home<br /><em>is right here.</em></h2><p>Explore new and pre-owned mobile homes, flexible options, and a team ready to help you take the next step.</p><Link className="brand-promo-link" href="/collections">Explore our homes <ArrowRight size={16} /></Link></div>
            <div className="brand-promo-frame"><div className="brand-promo-frame-top"><span>ANTHONY MOBILE HOMES</span><span>YOUR NEXT CHAPTER</span></div><div className="brand-promo-image"><Image src="/slogo.jpeg" alt="Anthony Mobile Homes team and home selection" fill sizes="(max-width: 760px) 100vw, 60vw" /></div><div className="brand-promo-frame-bottom"><span>New &amp; pre-owned homes</span><span>Find a place to call home <ArrowUpRight size={15} /></span></div></div>
          </div>
        </section>

        <section className="proof-strip" aria-label="What Anthony Mobile Homes offers">{[{ title: "New & pre-owned", text: "Homes for different needs" }, { title: "Financing options", text: "Talk through your choices" }, { title: "A large selection", text: "Explore styles and layouts" }, { title: "Personal guidance", text: "Here from start to move-in" }].map((item) => <div className="proof-item" key={item.title}><span className="proof-check"><Check size={14} /></span><div><strong>{item.title}</strong><small>{item.text}</small></div></div>)}</section>

        <section className="home-carousel-section" id="homes" data-reveal>
          <div className="carousel-heading"><div><p className="eyebrow"><span className="eyebrow-line" />Start with a look around</p><h2>Explore featured homes</h2><p className="section-description">See the home styles, layouts, and spaces that could make your next chapter feel like yours.</p></div><div className="carousel-actions"><span>0{collections.length} homes to explore</span><button aria-label="Scroll homes left" onClick={() => scrollRail(homesRail, -1)}><ArrowLeft size={17} /></button><button aria-label="Scroll homes right" onClick={() => scrollRail(homesRail, 1)}><ArrowRight size={17} /></button></div></div>
          <div className="home-rail" ref={homesRail}>{collections.map((collection, index) => <Link className="home-tile" key={collection.id} href={`/collections/${collection.id}`}><div className="home-tile-image" style={{ backgroundImage: `url("${collection.imageUrl}")` }}><span className="tile-tag">FEATURED HOME 0{index + 1}</span><span className="tile-open"><ArrowUpRight size={20} /></span></div><div className="home-tile-copy"><div><small>{collection.subtitle}</small><h3>{collection.name}</h3><small className="home-tile-price">{collection.price || "Contact for pricing"}</small></div><span>{collection.rooms.length} spaces <ArrowRight size={14} /></span></div></Link>)}</div>
          <p className="image-note">Model photos are for illustration. Ask Anthony Mobile Homes about current availability, specifications, and pricing.</p>
          <Link className="all-homes-link" href="/collections">View all home collections <ArrowRight size={16} /></Link>
        </section>

        <section className="buying-section" id="about" data-reveal>
          <div className="buying-photo" role="img" aria-label="Living room and kitchen inside a manufactured home" />
          <div className="buying-copy"><p className="eyebrow"><span className="eyebrow-line" />A more welcoming way to buy</p><h2>Let’s make finding home <em>feel easier.</em></h2><p>Buying a home is a big step. We’re here to help you explore your options, understand the process, and find a home that works for your budget and your life.</p><ul><li><Check size={15} /> New and pre-owned homes</li><li><Check size={15} /> Financing options to discuss</li><li><Check size={15} /> Guidance from selection to move-in</li></ul><a className="blue-link" href="tel:+14702194472">Get to know your options <ArrowUpRight size={16} /></a></div>
        </section>

        <section className="spaces-section" data-reveal><div className="spaces-heading"><div><p className="eyebrow"><span className="eyebrow-line" />Designed for everyday life</p><h2>Take a look inside</h2></div><div className="carousel-actions"><button aria-label="Scroll spaces left" onClick={() => scrollRail(spacesRail, -1)}><ArrowLeft size={17} /></button><button aria-label="Scroll spaces right" onClick={() => scrollRail(spacesRail, 1)}><ArrowRight size={17} /></button></div></div><div className="spaces-rail" ref={spacesRail}>{spaces.map((room, index) => <button className="space-tile" key={room.id} onClick={() => collections[0] && setSelected(collections[0])}><div style={{ backgroundImage: `url("${room.imageUrl}")` }}><span>0{index + 1}</span><ArrowUpRight size={18} /></div><h3>{room.name}</h3><p>{room.description}</p></button>)}</div></section>

        <section className="process-section" id="process" data-reveal><div className="process-intro"><p className="eyebrow light"><span className="eyebrow-line" />From first look to move-in</p><h2>A home buying journey,<br /><em>made clearer.</em></h2><p>We’ll take it one step at a time and help you know what comes next.</p><a className="process-call" href="tel:+14702194472">Call +1 (470) 219-4472 <ArrowUpRight size={16} /></a></div><div className="process-steps">{buyingSteps.map((step) => <article className="process-step" key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div><ArrowUpRight size={16} /></article>)}</div></section>

        <section className="contact-section" id="contact" data-reveal><div className="contact-pitch"><p className="eyebrow"><span className="eyebrow-line" />Your next chapter</p><h2>Ready to find<br /><em>your next home?</em></h2><p className="contact-intro">Tell us what you’re looking for. We’ll help you take the next step.</p><div className="contact-actions"><a className="contact-link" href="tel:+14702194472">+1 (470) 219-4472 <ArrowUpRight size={18} /></a><Link className="contact-link" href="/account">Message our team <ArrowUpRight size={18} /></Link></div></div><form className="call-form" onSubmit={requestCall}><p className="eyebrow"><span className="eyebrow-line" />Schedule a call</p><div className="call-form-row"><label>Your name<input name="name" required placeholder="Full name" /></label><label>Email<input name="email" type="email" required placeholder="you@example.com" /></label></div><div className="call-form-row"><label>Phone<input name="phone" type="tel" required placeholder="(701) 555-0123" /></label><label>Preferred day<input name="day" type="date" required /></label></div><label>Preferred time<select name="time" required defaultValue=""><option value="" disabled>Select a time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label><label>What are you looking for?<textarea name="message" rows={2} placeholder="Share a little about the home you have in mind" /></label><button type="submit">Request a call <ArrowUpRight size={16} /></button></form></section>
        <ReviewsSection reviews={reviews} />
      </>}

      <SiteFooter />
      <a className="whatsapp-float" href="https://wa.me/17017139763?text=Hello%20Anthony%20Mobile%20Homes%2C%20I%27m%20interested%20in%20your%20homes." target="_blank" rel="noreferrer" aria-label="Inquire on WhatsApp at +1 701 713 9763"><WhatsAppIcon/><span>WhatsApp inquiry</span></a>
    </main>
  );
}
