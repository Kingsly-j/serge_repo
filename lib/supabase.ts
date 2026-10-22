import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && publishableKey ? createClient(url, publishableKey) : null;
export const PHOTOS_BUCKET = "photos";

export async function uploadPhoto(file: File) {
  if (!supabase) throw new Error("Supabase environment variables are not configured.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(data.path).data.publicUrl;
}
