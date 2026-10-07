# Custom domains

Woza Art is a single deployment serving every gallery. `proxy.ts` resolves
which gallery a request belongs to from its host header, in order:

1. An exact match against a gallery's `custom_domain` column, only when its
   `domain_status` is `'verified'`.
2. The `<slug>.<apex>` subdomain pattern, where `<apex>` is
   `NEXT_PUBLIC_PLATFORM_APEX_DOMAIN` and `<slug>` is the gallery's `slug`
   column.
3. `DEFAULT_GALLERY_SLUG`, for the bare apex domain, `localhost`, and
   `*.vercel.app` preview URLs.

A gallery's full look (colors, fonts, nav tabs, logo, commission copy) lives
on its `galleries` row, not in a per-gallery build — see the columns added in
`supabase/migrations/20261008120000_gallery_theming.sql`. There is no
per-gallery build, deploy target, or hosting site anymore: attaching a domain
is sufficient on its own.

Gallery-facing steps live in the in-app guide under **Custom domain**
(`app/(marketing)/docs/page.tsx`). Keep the two in sync.

## 1. Attach the domain

A gallery owner does this themselves from **Dashboard → Settings**
(`components/dashboard/SettingsPanel.tsx`), which calls the server actions in
`lib/supabase/domain-actions.ts`:

- `connectCustomDomain` — calls `addDomainToProject` (`lib/vercel/domains.ts`)
  to attach the domain to the single shared Vercel project, stores it on
  `galleries.custom_domain`, and sets `domain_status = 'pending'`.
- `refreshDomainStatus` — polls `getDomainStatus` and flips `domain_status` to
  `'verified'` once Vercel confirms DNS, or `'error'` if misconfigured.
- `disconnectCustomDomain` — calls `removeDomainFromProject` and clears the
  row.

No code change or redeploy is needed per gallery — once `domain_status` is
`'verified'`, `proxy.ts` starts routing that host to the gallery
immediately.

## 2. DNS

`dnsInstructionsFor()` (`lib/vercel/domains.ts`) returns the record the
gallery needs to add at their registrar: an `A` record to Vercel's anycast IP
for an apex domain, or a `CNAME` to `cname.vercel-dns.com` for a subdomain.
Only add the records for the exact domain being attached — never change the
gallery's existing root or `www` records for anything else.

## 3. Supabase auth

1. Supabase dashboard → Authentication → URL Configuration.
2. Add to **Redirect URLs**: `https://<gallery-domain>/**` (or the exact
   `/auth/callback` path used by `app/auth/callback/route.ts`).
3. Do **not** change the project-wide Site URL unless every gallery is
   moving — it's shared across all tenants in this one Supabase project.
4. `supabase/config.toml` holds local values only (`site_url`,
   `additional_redirect_urls`). Production values are set in the dashboard.

## 4. Smoke test

- [ ] The domain loads with a valid certificate.
- [ ] `galleries.domain_status` for that row reads `'verified'`.
- [ ] Sign-in works and redirects to `/dashboard` or `/studio`.
- [ ] The gallery's own theme (colors, fonts, nav tabs) renders — confirms
      `proxy.ts` resolved the correct gallery row, not the platform
      default.
