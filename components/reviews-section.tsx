"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import type { CustomerReview } from "@/lib/reviews";

export function ReviewsSection({ reviews }: { reviews: CustomerReview[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reviews.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      const element = viewport.current;
      if (!element || paused) return;
      const loopWidth = element.scrollWidth / 2;
      if (element.scrollLeft >= loopWidth - 1) element.scrollLeft = 0;
      else element.scrollLeft += 0.7;
    }, 20);
    return () => window.clearInterval(timer);
  }, [paused, reviews.length]);

  function scrollReviews(direction: -1 | 1) {
    const element = viewport.current;
    if (!element) return;
    const loopWidth = element.scrollWidth / 2;
    const step = Math.max(260, element.clientWidth * 0.72);
    if (direction < 0 && element.scrollLeft >= loopWidth - 10) element.scrollLeft = 0;
    if (direction > 0 && element.scrollLeft <= 10 && loopWidth > element.clientWidth) element.scrollLeft = loopWidth;
    element.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return <section className="reviews-showcase" data-reveal aria-labelledby="reviews-title">
    <div className="reviews-showcase-heading"><p className="eyebrow"><span className="eyebrow-line" /> Notes from our customers</p><h2 id="reviews-title">Good homes begin<br /><em>with good people.</em></h2><p>Hear from people who have worked with Anthony Mobile Homes.</p>
      {reviews.length > 1 && <div className="reviews-carousel-controls"><button type="button" onClick={() => scrollReviews(-1)} aria-label="Scroll reviews left"><ArrowLeft size={17} /></button><button type="button" onClick={() => scrollReviews(1)} aria-label="Scroll reviews right"><ArrowRight size={17} /></button></div>}
    </div>
    {reviews.length ? <div className="customer-review-grid" aria-label="Customer reviews" ref={viewport} tabIndex={0} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      <div className="customer-review-track">
        {[reviews, reviews.length > 1 ? reviews : []].map((reviewSet, groupIndex) => reviewSet.length > 0 && <div className="customer-review-group" key={groupIndex} aria-hidden={groupIndex === 1 || undefined}>
          {reviewSet.map((review) => <article className="customer-review-card" key={`${groupIndex}-${review.id}`}>
            <div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</div>
            <blockquote>“{review.quote}”</blockquote>
            <div className="review-customer"><strong>{review.name}</strong>{review.location && <span>{review.location}</span>}</div>
          </article>)}
        </div>)}
      </div>
    </div> : <div className="reviews-empty"><span className="review-stars">★★★★★</span><h3>Customer stories are on the way.</h3><p>Our team is ready to help you find the right home and make your own experience worth sharing.</p><Link href="/account">Chat with our team</Link></div>}
  </section>;
}
