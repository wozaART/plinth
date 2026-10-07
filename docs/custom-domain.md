# Custom domain runbook (per gallery)

Puts a gallery's portal on `platform.<gallery-domain>`. Each gallery is its own build (`NEXT_PUBLIC_GALLERY=<slug>`) and its own Firebase Hosting site, so the steps are repeated per gallery.

Gallery-facing steps live in the in-app guide under **Custom domain** (`app/(marketing)/docs/page.tsx`). Keep the two in sync.

Hosting: classic Firebase Hosting for the domain and CDN, with the Next.js server on Cloud Run (or Functions) behind a rewrite. Hosting serves static files only, so the rewrite is required for middleware and Supabase SSR cookies.

## Placeholders

- `<slug>`: gallery slug, matching `lib/galleries/<slug>.config.ts` (e.g. `jvh`).
- `<gallery-domain>`: the domain the gallery already owns (e.g. `example-gallery.co.za`).
- `<site-id>`: the Firebase Hosting site ID for this gallery.

## 1. Build config

1. Confirm `lib/galleries/<slug>.config.ts` exists. Add it if not.
2. Add a build script to `package.json` that mirrors `build:jvh`:
   `"build:<slug>": "NEXT_PUBLIC_GALLERY=<slug> next build"`
3. Confirm the build runs locally: `npm run build:<slug>`.

## 2. Firebase Hosting site

1. Create the site: `firebase hosting:sites:create <site-id>`.
2. Add a target for it: `firebase target:apply hosting <gallery-target> <site-id>`.
3. In `firebase.json`, add a hosting entry for the target. Rewrite all paths to the Cloud Run service that runs the Next.js server:

   ```json
   {
     "hosting": [
       {
         "target": "<gallery-target>",
         "rewrites": [
           { "source": "**", "run": { "serviceId": "<cloud-run-service>", "region": "<region>" } }
         ]
       }
     ]
   }
   ```

4. Deploy the server and the static assets for this target. Confirm the exact deploy command against the current Firebase docs before running it.

## 3. DNS

1. In Firebase Hosting, add the custom domain `platform.<gallery-domain>` to the site.
2. Copy the records Firebase shows (usually a CNAME to the site's Firebase address, plus a TXT record for ownership). **Confirm the record types in the Firebase console; do not copy them from this document.**
3. Add the records at the gallery's DNS provider. For Squarespace, see the in-app guide (Custom domain → Add the DNS record). Only add the `platform` subdomain records. Never change the root or `www` records.
4. Wait for the Firebase status to show connected and the certificate to be issued.

## 4. Supabase auth

1. Supabase dashboard → Authentication → URL Configuration.
2. Add to **Redirect URLs**: `https://platform.<gallery-domain>/**` (or the exact `/auth/callback` path used by `app/auth/callback/route.ts`).
3. Do **not** change the project-wide Site URL unless every gallery is moving. A per-gallery Site URL is not supported by a shared Supabase project; invite and reset emails use the Site URL, so check which one each email template uses before changing it.
4. Note: `supabase/config.toml` holds the local values only (`site_url`, `additional_redirect_urls`). Production values are set in the dashboard, not in this file.

## 5. Smoke test

- [ ] `https://platform.<gallery-domain>` loads with a valid certificate.
- [ ] Sign-in works and redirects to `/dashboard` or `/studio`.
- [ ] A test invitation email's link opens `platform.<gallery-domain>`.
- [ ] The main Squarespace website still loads unchanged.

## Troubleshooting

- **Certificate pending:** DNS not yet visible. Check the records with `dig +short CNAME platform.<gallery-domain>` and wait.
- **Sign-in redirects to the wrong host:** the redirect URL is missing from Supabase, or the invite email uses the Site URL.
- **Blank page or 404 on subpaths:** the rewrite is missing or points at the wrong Cloud Run service.

## Not covered here

- Runtime host-based gallery resolution, automated DNS, and Squarespace-side changes. See `~/.claude/plans/i-want-to-build-smooth-key-alternatives.md`.
