"use client";

import { useEffect, useState } from "react";
import { initializeFirebaseAnalytics } from "@/lib/firebase";
import { supabase, uploadPhoto } from "@/lib/supabase";

export default function Home() {
  const [firebaseStatus, setFirebaseStatus] = useState("Checking Firebase…");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    initializeFirebaseAnalytics()
      .then((analytics) => setFirebaseStatus(analytics ? "Firebase connected" : "Firebase app initialized"))
      .catch(() => setFirebaseStatus("Firebase initialized; Analytics unavailable"));
  }, []);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const url = await uploadPhoto(file);
      setMessage(`Uploaded successfully: ${url}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Serge repo</p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-950">Backend connections</h1>
        <p className="max-w-xl text-zinc-600">Firebase initializes in the browser, and Supabase Storage is ready to upload images to the <code>photos</code> bucket.</p>
      </div>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Firebase</h2>
        <p className="mt-2 text-sm text-zinc-600">{firebaseStatus}</p>
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Supabase Storage</h2>
        <p className="mt-2 text-sm text-zinc-600">{supabase ? "Connected · photos bucket" : "Missing Supabase configuration"}</p>
        <label className="mt-5 inline-flex cursor-pointer items-center rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700">
          {uploading ? "Uploading…" : "Choose a photo"}
          <input className="sr-only" type="file" accept="image/*" disabled={!supabase || uploading} onChange={handleUpload} />
        </label>
        {message && <p className="mt-4 break-all text-sm text-zinc-700">{message}</p>}
      </section>
    </main>
  );
}
