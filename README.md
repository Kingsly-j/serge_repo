# serge_repo

Next.js application connected to Firebase Analytics and Supabase Storage.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Firebase and Supabase public configuration values.
3. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

Firebase Analytics initializes in the browser when supported. Photo uploads use the Supabase Storage bucket named `photos`; the bucket must exist and its policies must allow the intended uploads. The app displays a public URL, so make the bucket public or adjust the helper to use signed URLs for private storage.

## GitHub repository

The configured remote is `https://github.com/Kingsly-j/serge_repo.git` on branch `main`.
