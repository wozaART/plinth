# Database tests

pgTAP tests for the rules that live in SQL: RLS policies, the `record_sale` /
payout RPCs and the audit-log triggers. They run against the local Supabase
Postgres, so they exercise the real migrations.

```bash
supabase start        # or: supabase db start
npm run test:db       # = supabase test db --local
```

Needs Docker. The local database must be on the latest migrations
(`supabase migration up --local`); it doesn't need to be empty, because every
file runs inside a transaction that is rolled back, so your dev data is never
touched.

| File | Covers |
| --- | --- |
| `rls_isolation.test.sql` | gallery A vs gallery B, artist 1 vs artist 2, buyer details, anonymous access |
| `record_sale.test.sql` | commission split maths (rounding, 0%/100%, rate precedence, discounts), already-sold and cross-gallery rejection, payout creation |
| `payouts_and_bank_details.test.sql` | `mark_payout_paid` / `acknowledge_payout` / `query_payout` ownership and state rules, bank-detail disclosure |
| `audit_log.test.sql` | insert/update/delete triggers on contacts, exhibitions, catalogue works; actor, old/new record, per-gallery visibility |

Each file creates its own fixtures (two galleries, two artists) and a `tests`
helper schema inside its transaction: `tests.act_as(uuid)` switches to a
signed-in user (`null` for anon), `tests.gallery_of(owner)` finds a gallery.

## Known gap

`rls_isolation.test.sql` marks one assertion `todo`: artists can still read
`buyer_name/email/phone` on their own sales straight from `public.sales`
(`sales_select_artist` grants row access, and column grants can't tell owners
and artists apart because both are `authenticated`). The `artist_sales` view
itself is clean. Fixing it means moving `getArtistPayouts`, which embeds
`sales(...)`, onto a view first; remove the `todo()` when that lands.
