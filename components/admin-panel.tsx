"use client";

import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import { collection as firestoreCollection, deleteDoc, doc, setDoc, writeBatch } from "firebase/firestore/lite";
import { ImagePlus, Plus, Trash2, Upload, X } from "@/components/icons";
import { starterCollections, type Collection, type Room } from "@/lib/catalog";
import type { CustomerReview } from "@/lib/reviews";
import { publicFirestore } from "@/lib/firebase-public";
import { firebaseAuth } from "@/lib/firebase-auth-client";
import { uploadPhoto } from "@/lib/supabase";

type DraftRoom = Omit<Room, "id">;
type TrafficData = { pageViews: number; uniqueVisitors: number; locations: { label: string; visits: number }[]; pages: { path: string; views: number }[]; timeline: { label: string; pageViews: number; visitors: number }[]; locationCoverage: number; capped: boolean };
const emptyRoom = (): DraftRoom => ({ name: "", description: "", imageUrl: "" });

export function AdminPanel({ onClose, onSaved, onSignOut, collections, reviews }: { onClose: () => void; onSaved: () => void; onSignOut: () => void; collections: Collection[]; reviews: CustomerReview[] }) {
  const [activePage, setActivePage] = useState<"overview" | "homes" | "reviews" | "traffic" | "settings">("overview");
  const [homeFormOpen, setHomeFormOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [rooms, setRooms] = useState<DraftRoom[]>([emptyRoom()]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [reviewEditingId, setReviewEditingId] = useState<string | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewLocation, setReviewLocation] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewQuote, setReviewQuote] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [trafficRange, setTrafficRange] = useState<"24h" | "7d" | "30d">("30d");
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficError, setTrafficError] = useState("");

  useEffect(() => {
    if (activePage !== "traffic") return;
    let cancelled = false;
    async function loadTraffic() {
      setTrafficLoading(true); setTrafficError("");
      try {
        const user = firebaseAuth.currentUser;
        if (!user) throw new Error("Your admin session has expired. Sign in again to view site traffic.");
        const token = await getIdToken(user);
        const response = await fetch(`/api/traffic?range=${trafficRange}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Traffic report could not be loaded.");
        if (!cancelled) setTrafficData(result as TrafficData);
      } catch (error) { if (!cancelled) setTrafficError(error instanceof Error ? error.message : "Traffic report could not be loaded."); }
      finally { if (!cancelled) setTrafficLoading(false); }
    }
    void loadTraffic();
    return () => { cancelled = true; };
  }, [activePage, trafficRange]);

  async function upload(file: File, done: (url: string) => void) {
    try { done(await uploadPhoto(file)); setNotice("Photo uploaded to Supabase."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Photo upload failed."); }
  }

  function startEdit(collection: Collection) {
    setActivePage("homes");
    setHomeFormOpen(true);
    setEditingId(collection.id);
    setName(collection.name);
    setSubtitle(collection.subtitle);
    setDescription(collection.description);
    setPrice(collection.price || "Contact for pricing");
    setImageUrl(collection.imageUrl);
    setRooms(collection.rooms.map(({ name: roomName, description: roomDescription, imageUrl: roomImage }) => ({ name: roomName, description: roomDescription, imageUrl: roomImage })));
    setNotice(`Editing ${collection.name}.`);
    document.querySelector(".admin-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    setHomeFormOpen(false);
    setEditingId(null);
    setName(""); setSubtitle(""); setDescription(""); setPrice(""); setImageUrl(""); setRooms([emptyRoom()]);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice("");
    try {
      const body = { name, subtitle, description, price, imageUrl, rooms: rooms.map((room, index) => ({ ...room, id: `${Date.now()}-${index}` })) };
      if (editingId) {
        await setDoc(doc(publicFirestore, "collections", editingId), { ...body, deleted: false, updatedAt: new Date().toISOString() }, { merge: true });
      } else {
        const reference = doc(firestoreCollection(publicFirestore, "collections"));
        await setDoc(reference, { ...body, sortOrder: 0, createdAt: new Date().toISOString() });
      }
      setNotice(editingId ? "Collection updated in Firebase." : "Collection saved to Firebase.");
      resetForm();
      onSaved();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save collection."); }
    finally { setBusy(false); }
  }

  async function remove(collection: Collection) {
    if (!window.confirm(`Delete ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“${collection.name}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â and all of its room details?`)) return;
    setBusy(true); setNotice("");
    try {
      if (starterCollections.some((item) => item.id === collection.id)) {
        await setDoc(doc(publicFirestore, "collections", collection.id), { deleted: true, updatedAt: new Date().toISOString() }, { merge: true });
      } else {
        await deleteDoc(doc(publicFirestore, "collections", collection.id));
      }
      if (editingId === collection.id) resetForm();
      setNotice(`${collection.name} was deleted.`);
      onSaved();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not delete collection."); }
    finally { setBusy(false); }
  }

  async function moveCollection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= collections.length) return;
    const ordered = [...collections];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setBusy(true); setNotice("");
    try {
      const batch = writeBatch(publicFirestore);
      ordered.forEach((collection, order) => batch.set(doc(publicFirestore, "collections", collection.id), { sortOrder: order, deleted: false, updatedAt: new Date().toISOString() }, { merge: true }));
      await batch.commit();
      setNotice("Collection order updated.");
      onSaved();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not reorder collections."); }
    finally { setBusy(false); }
  }

  function startReviewEdit(review: CustomerReview) {
    setActivePage("reviews"); setReviewFormOpen(true);
    setReviewEditingId(review.id); setReviewName(review.name); setReviewLocation(review.location || ""); setReviewRating(review.rating); setReviewQuote(review.quote); setReviewNotice(`Editing ${review.name}'s review.`);
  }

  function clearReviewForm() {
    setReviewFormOpen(false);
    setReviewEditingId(null); setReviewName(""); setReviewLocation(""); setReviewRating(5); setReviewQuote("");
  }

  async function saveReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setReviewNotice("");
    try {
      const review = { name: reviewName.trim(), location: reviewLocation.trim(), rating: reviewRating, quote: reviewQuote.trim(), updatedAt: new Date().toISOString() };
      if (reviewEditingId) {
        await setDoc(doc(publicFirestore, "reviews", reviewEditingId), review, { merge: true });
      } else {
        const reference = doc(firestoreCollection(publicFirestore, "reviews"));
        await setDoc(reference, { ...review, createdAt: new Date().toISOString() });
      }
      setReviewNotice(reviewEditingId ? "Review updated." : "Review added.");
      clearReviewForm();
      onSaved();
    } catch (error) { setReviewNotice(error instanceof Error ? error.message : "Could not save review."); }
    finally { setBusy(false); }
  }

  async function removeReview(review: CustomerReview) {
    if (!window.confirm(`Delete the review from ${review.name}?`)) return;
    setBusy(true); setReviewNotice("");
    try {
      await deleteDoc(doc(publicFirestore, "reviews", review.id));
      if (reviewEditingId === review.id) clearReviewForm();
      setReviewNotice("Review deleted."); onSaved();
    } catch (error) { setReviewNotice(error instanceof Error ? error.message : "Could not delete review."); }
    finally { setBusy(false); }
  }

  const pageTitle = activePage === "overview" ? "Overview" : activePage === "homes" ? "Home collections" : activePage === "reviews" ? "Customer reviews" : activePage === "traffic" ? "Site traffic" : "Settings";
  const visibleHomes = activePage === "overview" ? collections.slice(0, 4) : collections;

  return <div className="admin-scrim admin-dashboard-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-dashboard" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand"><span className="admin-brand-mark">A</span><span><strong>ANTHONY</strong><small>MOBILE HOMES</small></span></a>
        <p className="admin-sidebar-label">WORKSPACE</p>
        <nav className="admin-sidebar-nav" aria-label="Admin pages">
          {([ ["overview", "Overview", "⌂"], ["homes", "Home collections", "▧"], ["reviews", "Reviews", "☆"], ["traffic", "Site traffic", "↗"], ["settings", "Settings", "⚙"] ] as const).map(([page, label, icon]) => <button type="button" key={page} className={`admin-nav-button ${activePage === page ? "is-active" : ""}`} aria-current={activePage === page ? "page" : undefined} onClick={() => setActivePage(page)}><span>{icon}</span>{label}{page === "homes" && <small>{collections.length}</small>}{page === "reviews" && <small>{reviews.length}</small>}</button>)}
        </nav>       <div className="admin-sidebar-bottom"><span className="admin-status-dot" /> Storefront is live <a href="/" target="_blank" rel="noreferrer">View website ?</a><button type="button" onClick={onClose}>? Back to site</button></div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-dashboard-header"><div><span className="admin-breadcrumb">ANTHONY <i>/</i> ADMIN</span><h1 id="admin-title">{pageTitle}</h1></div><div className="admin-top-actions"><span className="admin-account-email">support@anthonymobilehomes.com</span><button type="button" className="admin-sign-out" onClick={onSignOut}>Sign out</button><button aria-label="Close admin" className="admin-close" onClick={onClose}><X /></button></div></header>
        <main className="admin-dashboard-content">
          {activePage === "overview" && <section className="admin-page-section">
            <div className="admin-welcome"><div><p className="eyebrow"><span className="eyebrow-line" /> YOUR STORE, AT A GLANCE</p><h2>Welcome back.</h2><p>Manage your home catalog and customer stories in one place.</p></div><span className="admin-welcome-seal">A</span></div>
            <div className="admin-summary-grid"><article className="admin-stat-card"><span>AVAILABLE COLLECTIONS</span><strong>{collections.length}</strong><small>Homes in your catalog</small></article><article className="admin-stat-card"><span>CUSTOMER REVIEWS</span><strong>{reviews.length}</strong><small>Stories on your storefront</small></article><article className="admin-stat-card admin-stat-feature"><span>STOREFRONT</span><strong>Live</strong><small>Visitors can explore and enquire</small></article></div>
            <div className="admin-quick-actions"><button type="button" onClick={() => { resetForm(); setActivePage("homes"); setHomeFormOpen(true); }}><span>+</span><strong>Add a home</strong><small>Create a new collection listing</small></button><button type="button" onClick={() => { clearReviewForm(); setReviewNotice(""); setActivePage("reviews"); setReviewFormOpen(true); }}><span>?</span><strong>Add a review</strong><small>Share a customerÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s experience</small></button></div>
            <div className="admin-dashboard-toolbar"><div><h2>Recently added homes</h2><p>Newest collections appear first on your website.</p></div><button type="button" className="admin-secondary-action" onClick={() => setActivePage("homes")}>View all homes ?</button></div>
            <div className="admin-data-list">{visibleHomes.length ? visibleHomes.map((collection, index) => <article className="admin-list-row" key={collection.id}><div className="admin-row-thumb" style={{ backgroundImage: `url("${collection.imageUrl}")` }} aria-hidden="true"/><div className="admin-row-copy"><strong>{collection.name}</strong><small>{collection.subtitle || "Home collection"}</small></div><span className="admin-row-price">{collection.price || "Contact for pricing"}</span><button type="button" className="admin-row-edit" disabled={busy} onClick={() => startEdit(collection)}>Edit</button></article>) : <div className="admin-empty-state"><span>Ãƒâ€šÃ‚Â¦</span><strong>Your catalog is ready for its first home</strong><p>Add a collection to begin showcasing homes.</p><button type="button" onClick={() => { setActivePage("homes"); setHomeFormOpen(true); }}>Add your first home <Plus size={15}/></button></div>}</div>
          </section>}
          {activePage === "homes" && <section className="admin-page-section"><div className="admin-dashboard-toolbar admin-page-toolbar"><div><p className="eyebrow"><span className="eyebrow-line" /> YOUR CATALOG</p><h2>Home collections</h2><p>Add and manage the homes and room details shown to visitors.</p></div><button type="button" className="admin-primary-action" onClick={() => { resetForm(); setHomeFormOpen(true); }}><Plus size={16}/> New collection</button></div>
            <div className="admin-data-list">{collections.length ? collections.map((collection, index) => <article className="admin-list-row" key={collection.id}><div className="admin-row-thumb" style={{ backgroundImage: `url("${collection.imageUrl}")` }} aria-hidden="true"/><div className="admin-row-copy"><strong>{collection.name}</strong><small>{collection.rooms.length} spaces Ãƒâ€šÃ‚Â· {collection.subtitle || "Home collection"}</small></div><span className="admin-row-price">{collection.price || "Contact for pricing"}</span><div className="admin-list-actions"><button type="button" disabled={busy || index === 0} onClick={() => void moveCollection(index, -1)} aria-label={`Move ${collection.name} earlier`}>?</button><button type="button" disabled={busy || index === collections.length - 1} onClick={() => void moveCollection(index, 1)} aria-label={`Move ${collection.name} later`}>?</button><button type="button" disabled={busy} onClick={() => startEdit(collection)}>Edit</button><button type="button" className="admin-delete" disabled={busy} onClick={() => void remove(collection)} aria-label={`Delete ${collection.name}`}><Trash2 size={14}/></button></div></article>) : <div className="admin-empty-state"><span>Ãƒâ€šÃ‚Â¦</span><strong>No home collections yet</strong><p>Create your first collection and add its rooms, photos, and price.</p><button type="button" onClick={() => setHomeFormOpen(true)}>Create collection <Plus size={15}/></button></div>}</div>
            {notice && <p className="admin-notice" role="status">{notice}</p>}
            {homeFormOpen && <form onSubmit={save} className="admin-form"><div className="rooms-form-title admin-edit-heading"><div><span>{editingId ? "Edit home collection" : "New home collection"}</span><small>{editingId ? "Update pricing, details, photos, and spaces." : "Add pricing, photos, and interior spaces."}</small></div><button className="add-room" type="button" onClick={resetForm}>Close <X size={14}/></button></div>
              <div className="admin-two"><label>Home or collection name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. The Ridge" /></label><label>Price<input required value={price} onChange={(event) => setPrice(event.target.value)} placeholder="e.g. $18,500" /></label></div>
              <label>Short introduction<input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Room for the whole family" /></label><label>Description<textarea rows={3} required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the home and its standout details" /></label>
              <PhotoField label="Cover image" url={imageUrl} setUrl={setImageUrl} upload={upload}/>
              <div className="rooms-form-title"><div><span>Home spaces</span><small>Rooms and areas in this collection</small></div><button type="button" className="add-room" onClick={() => setRooms([...rooms, emptyRoom()])}><Plus size={15}/> Add room</button></div>
              <div className="admin-rooms">{rooms.map((room, index) => <div className="admin-room" key={index}><div className="admin-room-head"><strong>Room {String(index + 1).padStart(2, "0")}</strong>{rooms.length > 1 && <button type="button" aria-label="Remove room" onClick={() => setRooms(rooms.filter((_, roomIndex) => roomIndex !== index))}><Trash2 size={15}/></button>}</div><div className="admin-two"><label>Room name<input required value={room.name} onChange={(event) => setRooms(rooms.map((item, roomIndex) => roomIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Kitchen" /></label><label>Short description<input value={room.description} onChange={(event) => setRooms(rooms.map((item, roomIndex) => roomIndex === index ? { ...item, description: event.target.value } : item))} placeholder="A place to gather" /></label></div><PhotoField label="Room photo" url={room.imageUrl} setUrl={(url) => setRooms(rooms.map((item, roomIndex) => roomIndex === index ? { ...item, imageUrl: url } : item))} upload={upload}/></div>)}</div>
              {notice && <p className="admin-notice" role="status">{notice}</p>}<button disabled={busy} className="save-collection" type="submit">{busy ? "SavingÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦" : editingId ? "Save collection changes" : "Create collection"} <Plus size={16}/></button>
            </form>}
          </section>}
          {activePage === "reviews" && <section className="admin-page-section"><div className="admin-dashboard-toolbar admin-page-toolbar"><div><p className="eyebrow"><span className="eyebrow-line" /> CUSTOMER STORIES</p><h2>Reviews</h2><p>Manage the customer feedback displayed on your storefront.</p></div><button type="button" className="admin-primary-action" onClick={() => { clearReviewForm(); setReviewNotice(""); setReviewFormOpen(true); }}><Plus size={16}/> Add review</button></div>
            {reviewNotice && <p className="admin-notice" role="status">{reviewNotice}</p>}
            <div className="admin-data-list">{reviews.length ? reviews.map((review) => <article className="admin-review-row" key={review.id}><div className="admin-review-avatar">{review.name.trim().charAt(0).toUpperCase() || "?"}</div><div className="admin-review-copy"><strong>{review.name}</strong><small><span>{"?".repeat(review.rating)}</span> Ãƒâ€šÃ‚Â· {review.location || "Customer"}</small><p>{review.quote}</p></div><div className="admin-review-actions"><button type="button" disabled={busy} onClick={() => startReviewEdit(review)}>Edit</button><button type="button" className="admin-delete" disabled={busy} onClick={() => void removeReview(review)} aria-label={`Delete ${review.name}'s review`}><Trash2 size={14}/></button></div></article>) : <div className="admin-empty-state"><span>?</span><strong>No customer reviews yet</strong><p>Add a real customerÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s feedback to feature on the homepage.</p></div>}</div>
            {reviewFormOpen && <form className="admin-review-form" onSubmit={saveReview}><div className="rooms-form-title"><div><span>{reviewEditingId ? "Edit customer review" : "Add customer review"}</span><small>Use feedback shared by an actual customer.</small></div><button type="button" className="add-room" onClick={clearReviewForm}>Close <X size={14}/></button></div><div className="admin-two"><label>Customer name<input required value={reviewName} onChange={(event) => setReviewName(event.target.value)} placeholder="Customer name" /></label><label>Location (optional)<input value={reviewLocation} onChange={(event) => setReviewLocation(event.target.value)} placeholder="City, state" /></label></div><div className="admin-two"><label>Rating<select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}>{[5,4,3,2,1].map((stars) => <option key={stars} value={stars}>{stars} stars</option>)}</select></label></div><label>Review<textarea rows={3} required value={reviewQuote} onChange={(event) => setReviewQuote(event.target.value)} placeholder="Enter the customer's feedback" /></label><button className="save-collection" type="submit" disabled={busy}>{busy ? "SavingÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦" : reviewEditingId ? "Save review changes" : "Add review"}<Plus size={16}/></button></form>}
          </section>}
          {activePage === "traffic" && <section className="admin-page-section"><div className="admin-dashboard-toolbar admin-page-toolbar"><div><p className="eyebrow"><span className="eyebrow-line" /> STOREFRONT ANALYTICS</p><h2>Site traffic</h2><p>Visitor and page view activity. Location may use approximate browser time zone unless edge location is available.</p></div><div className="traffic-range-tabs" role="group" aria-label="Traffic date range">{([["24h", "24 hours"], ["7d", "7 days"], ["30d", "30 days"]] as const).map(([range, label]) => <button type="button" key={range} className={trafficRange === range ? "is-active" : ""} onClick={() => setTrafficRange(range)}>{label}</button>)}</div></div>
            {trafficLoading && <p className="traffic-state">Loading your latest traffic report…</p>}
            {trafficError && <div className="traffic-error" role="alert"><strong>Traffic report unavailable</strong><p>{trafficError}</p><small>Check that the Firebase Admin credentials are configured on the server.</small></div>}
            {trafficData && <><div className="admin-summary-grid traffic-summary"><article className="admin-stat-card"><span>UNIQUE VISITORS</span><strong>{trafficData.uniqueVisitors.toLocaleString()}</strong><small>Across this period</small></article><article className="admin-stat-card"><span>PAGE VIEWS</span><strong>{trafficData.pageViews.toLocaleString()}</strong><small>Total pages viewed</small></article><article className="admin-stat-card admin-stat-feature"><span>LOCATION DATA</span><strong>{trafficData.locationCoverage}%</strong><small>Visits with edge provided city or country</small></article></div>
              <div className="traffic-chart-card"><div className="traffic-section-heading"><div><h3>Visits over time</h3><p>Page views in selected period</p></div><span className="traffic-legend"><i/> Page views</span></div><div className={`traffic-chart traffic-chart-${trafficRange}`} role="img" aria-label={`${trafficData.pageViews} page views over the selected period`}>{trafficData.timeline.map((bucket, index) => { const maximum = Math.max(1, ...trafficData.timeline.map((item) => item.pageViews)); return <div className="traffic-chart-column" key={`${bucket.label}-${index}`} title={`${bucket.label}: ${bucket.pageViews} page views`}><div className="traffic-chart-bar-wrap"><i style={{ height: `${Math.max(bucket.pageViews ? 7 : 2, bucket.pageViews / maximum * 100)}%` }}/></div><small>{bucket.label}</small></div>; })}</div></div>
              <div className="traffic-detail-grid"><section className="traffic-list-card"><div className="traffic-section-heading"><div><h3>Top locations</h3><p>Approximate location, when available</p></div><span>VISITS</span></div>{trafficData.locations.length ? trafficData.locations.map((location) => <div className="traffic-data-row" key={location.label}><span className="traffic-location-pin">⌖</span><strong>{location.label}</strong><small>{location.visits}</small></div>) : <p className="traffic-empty">No visits recorded in this period.</p>}</section><section className="traffic-list-card"><div className="traffic-section-heading"><div><h3>Popular pages</h3><p>Most viewed pages in this period</p></div><span>VIEWS</span></div>{trafficData.pages.length ? trafficData.pages.map((page) => <div className="traffic-data-row" key={page.path}><span className="traffic-page-icon">↗</span><strong className="traffic-page-path">{page.path}</strong><small>{page.views}</small></div>) : <p className="traffic-empty">No pages recorded in this period.</p>}</section></div>
              <p className="traffic-privacy-note">Traffic uses an anonymous browser ID. Precise location and IP addresses are not stored. City and country are shown only when supplied by the hosting network; other entries use the visitor’s browser time zone.</p>{trafficData.capped && <p className="traffic-privacy-note">This report reached the 10,000 event limit. The totals may be incomplete.</p>}
            </>}
          </section>}
          {activePage === "settings" && <section className="admin-page-section"><div className="admin-page-intro"><p className="eyebrow"><span className="eyebrow-line" /> ACCOUNT & STORE</p><h2>Settings</h2><p>Review your admin access and the services connected to your storefront.</p></div><article className="admin-settings-card"><span className="admin-settings-icon">?</span><div><small>ADMIN ACCOUNT</small><h3>Anthony Mobile Homes</h3><p>Signed in as <strong>support@anthonymobilehomes.com</strong></p></div></article><article className="admin-settings-card"><span className="admin-settings-icon">?</span><div><small>CONTENT STORAGE</small><h3>Firebase & Supabase</h3><p>Collection and review details are managed in Firebase. Uploaded photos are stored in the Supabase photos bucket.</p></div></article><button type="button" className="admin-settings-signout" onClick={onSignOut}>Sign out of admin <span>?</span></button></section>}
        </main>
      </div>
      <nav className="admin-dashboard-mobile-nav" aria-label="Admin pages">{([ ["overview", "Home", "⌂"], ["homes", "Collections", "▧"], ["reviews", "Reviews", "☆"], ["traffic", "Traffic", "↗"], ["settings", "Settings", "⚙"] ] as const).map(([page, label, icon]) => <button type="button" key={page} className={activePage === page ? "is-active" : ""} aria-current={activePage === page ? "page" : undefined} onClick={() => setActivePage(page)}><span>{icon}</span>{label}</button>)}</nav>    </section>
  </div>;
}

function PhotoField({ label, url, setUrl, upload }: { label: string; url: string; setUrl: (url: string) => void; upload: (file: File, done: (url: string) => void) => void }) {
  return <div className="photo-field"><span>{label}</span><div className="photo-input-row"><label className="photo-upload"><ImagePlus size={16} /> Upload photo<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file, setUrl); event.target.value = ""; }} /></label><span>or</span><input aria-label={`${label} image URL`} type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste image URL" /></div>{url && <div className="photo-preview" style={{ backgroundImage: `url("${url}")` }}><span><Upload size={13} /> Image ready</span></div>}</div>;
}
