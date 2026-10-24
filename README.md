# Anthony Mobile Homes

A mobile home catalog with priced collections, room galleries, photo uploads, reviews, and an admin editor.

## Local setups

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`. The Firebase web configuration and Supabase publishable key are public client settings; use your own project values if needed.
3. Publish the included Firestore rules to Firebase project `serge-dcacd` (see below).
4. Apply `supabase/migrations/20261022000000_public_photos_bucket.sql` in the Supabase SQL Editor for the configured project.
5. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The app stores home collections and reviews in Firestore. Uploaded photos go to the public Supabase Storage bucket `photos`; their public URLs are stored with the Firestore collection or room document. Photos may also be entered by URL.

## Firebase setup

The included `firebase.json`, `.firebaserc`, and `firestore.rules` target project `serge-dcacd`. From a machine with Firebase CLI authenticated, publish the rules with:

```sh
firebase deploy --only firestore:rules
```

The rules allow public reads in `collections` and `reviews`, and restrict changes to the signed-in `support@anthonymobilehomes.com` Firebase account. On any site page, type `admin` outside of a form to open the sign-in dialog. The password is never embedded in the app.

The starter catalog and reviews are stored in Firestore. Admin collection and review changes are written directly through the authenticated Firebase client.

## Supabase setup

In the Supabase Dashboard, open **SQL Editor**, paste the contents of `supabase/migrations/20261022000000_public_photos_bucket.sql`, and run it. This creates or updates a public `photos` bucket (10 MB per image, JPEG/PNG/WebP/GIF) and allows anonymous uploads and reads. Keep any Supabase secret or service-role key out of the app; the app uses only the publishable key.

## Site behavior

Admins can add, edit, delete, and reorder collections, including room details and photos. New collections appear first by default. Admins can add, edit, or remove customer reviews. Add actual customer feedback before showing reviews publicly.

Each home has a WhatsApp purchase inquiry button. It opens a prefilled message with the home name, displayed price, description, and listing link. The visitor reviews and sends the message in WhatsApp; the site does not submit orders automatically.

Contact: support@anthonymobilehomes.com · +1 (701) 713-9763

## GitHub repository

https://github.com/Kingsly-j/serge_repo (branch `main`)
