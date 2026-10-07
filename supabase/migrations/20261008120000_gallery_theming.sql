-- Moves per-gallery branding/theming/nav/copy out of the build-time TS config
-- files (lib/galleries/<slug>.config.ts) and onto the galleries row, so a
-- single deployment can resolve a gallery's full look at request time
-- instead of baking one gallery in per build via NEXT_PUBLIC_GALLERY.

alter table public.galleries
  add column short_name text,
  add column tagline text,
  add column logo_wordmark_primary text,
  add column logo_wordmark_secondary text,
  add column logo_image_url text,

  add column theme_mode text not null default 'light'
    check (theme_mode in ('light', 'dark')),
  add column font_display jsonb not null
    default '{"googleFont":"Newsreader","weights":["400","500","600"],"styles":["normal","italic"]}',
  add column font_body jsonb not null default '{"googleFont":"Geist"}',
  add column font_mono jsonb default '{"googleFont":"Geist_Mono"}',
  add column theme_colors jsonb not null default '{}',

  add column gallery_tabs jsonb not null default '[]',
  add column studio_tabs jsonb not null default '[]',

  add column currency_code text not null default 'ZAR',
  add column submit_commission_note_template text not null
    default 'The gallery commission of {rate}% will be added on top of your asking price for the final sale price shown to collectors.';
