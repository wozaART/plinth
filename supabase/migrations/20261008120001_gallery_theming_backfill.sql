-- One-off transcription of the two existing static configs
-- (lib/galleries/default.config.ts, lib/galleries/jvh.config.ts) into the
-- columns added by 20261008120000_gallery_theming.sql, so the two existing
-- galleries keep their current look once the app stops reading those files.

update public.galleries
set
  short_name = 'Sable',
  tagline = 'The quiet operating system for small contemporary galleries.',
  logo_wordmark_primary = 'Plinth',
  logo_wordmark_secondary = null,
  theme_mode = 'light',
  font_display = '{"googleFont":"Newsreader","weights":["400","500","600"],"styles":["normal","italic"]}',
  font_body = '{"googleFont":"Geist"}',
  font_mono = '{"googleFont":"Geist_Mono"}',
  theme_colors = '{
    "accent": "#B5623C", "accentHover": "#9C4F30", "onAccent": "#FBFAF8",
    "solid": "#17150F", "onSolid": "#FBFAF8",
    "bgApp": "#FBFAF8", "bgShell": "#EFECE4", "sidebar": "#F4F1EA", "surface": "#FFFFFF", "surfaceDark": "#1C1A17",
    "text": "#17150F", "textBody": "#2A2723", "textSecondary": "#57534A", "textMuted": "#6B655B",
    "textSoft": "#8B8579", "textFaint": "#9A9486", "textEyebrow": "#A39D8E",
    "onDark": "#FBFAF8", "onDarkSoft": "#B8B2A6", "onDarkFaint": "#8A8478",
    "border": "#ECE8DE", "borderStrong": "#E7E3D9", "borderInput": "#E0DBCF", "borderChip": "#E4DFD3",
    "divider": "#F1EEE6", "borderDark": "#3D382F",
    "status": {
      "pending": {"bg": "#F4ECD9", "fg": "#8A6A1E", "dot": "#C2922F"},
      "approved": {"bg": "#E7EFE1", "fg": "#4A6138", "dot": "#6B8A4E", "panelBg": "#EEF2EA", "panelBorder": "#DBE6D2"},
      "declined": {"bg": "#F3E4E0", "fg": "#8A3A30", "dot": "#B04A3C", "panelBg": "#F8EAE6", "panelBorder": "#EAD2CB"},
      "changes": {"bg": "#E6EBEF", "fg": "#3C566B", "dot": "#5A7894", "panelBg": "#EAEEF2", "panelBorder": "#D5DEE6"}
    },
    "neutralChipBg": "#EEEAE0", "neutralChipFg": "#57534A"
  }',
  gallery_tabs = '[
    {"id":"submissions","label":"Submissions","enabled":true},
    {"id":"exhibitions","label":"Exhibitions","enabled":true},
    {"id":"catalogue","label":"Catalogue","enabled":true},
    {"id":"contacts","label":"Contacts","enabled":true},
    {"id":"frameshop","label":"Frameshop","enabled":false}
  ]',
  studio_tabs = '[
    {"id":"overview","label":"Overview","enabled":true},
    {"id":"submissions","label":"My submissions","enabled":true},
    {"id":"open-calls","label":"Open calls","enabled":true},
    {"id":"invitations","label":"Invitations","enabled":true},
    {"id":"messages","label":"Messages","enabled":true},
    {"id":"profile","label":"Profile","enabled":false}
  ]',
  currency_code = 'ZAR',
  submit_commission_note_template = 'The gallery commission of {rate}% will be added on top of your asking price for the final sale price shown to collectors.'
where slug = 'default';

update public.galleries
set
  short_name = 'JVH',
  tagline = 'Contemporary art from across South Africa, rotating monthly.',
  logo_wordmark_primary = 'JVH',
  logo_wordmark_secondary = 'ART GALLERY',
  theme_mode = 'dark',
  font_display = '{"googleFont":"Cinzel","weights":["500","600","700"]}',
  font_body = '{"googleFont":"Poppins","weights":["300","400","500","600","700"]}',
  font_mono = '{"googleFont":"Geist_Mono"}',
  theme_colors = '{
    "accent": "#22C39C", "accentHover": "#159A79", "onAccent": "#06251C",
    "solid": "#22C39C", "onSolid": "#06251C",
    "bgApp": "#0C0C0E", "bgShell": "#141416", "sidebar": "#0C0C0E", "surface": "#1A1A1D", "surfaceDark": "#0C0C0E",
    "text": "#F3F2F0", "textBody": "#F3F2F0", "textSecondary": "#C6C4CA", "textMuted": "#9A98A0",
    "textSoft": "#9A98A0", "textFaint": "#6E6C74", "textEyebrow": "#9A98A0",
    "onDark": "#F3F2F0", "onDarkSoft": "#C4C2C8", "onDarkFaint": "#8A8478",
    "border": "#2C2C31", "borderStrong": "#2C2C31", "borderInput": "#2C2C31", "borderChip": "#2C2C31",
    "divider": "#2C2C31", "borderDark": "#2C2C31",
    "status": {
      "pending": {"bg": "rgba(224,181,74,.14)", "fg": "#E6C15C", "dot": "#E0B54A"},
      "approved": {"bg": "#2E7D52", "fg": "#EAFBF1", "dot": "#3FBE7C", "panelBg": "rgba(34,195,156,.09)", "panelBorder": "rgba(34,195,156,.3)"},
      "declined": {"bg": "rgba(224,96,80,.14)", "fg": "#EDA093", "dot": "#D66152", "panelBg": "rgba(224,96,80,.09)", "panelBorder": "rgba(224,96,80,.3)"},
      "changes": {"bg": "rgba(90,160,220,.14)", "fg": "#8FC3E6", "dot": "#5AA0DC", "panelBg": "rgba(90,160,220,.09)", "panelBorder": "rgba(90,160,220,.3)"}
    },
    "neutralChipBg": "#232327", "neutralChipFg": "#9A98A0"
  }',
  gallery_tabs = '[
    {"id":"submissions","label":"Submissions","enabled":true},
    {"id":"exhibitions","label":"Exhibitions","enabled":true},
    {"id":"catalogue","label":"Catalogue","enabled":true},
    {"id":"frameshop","label":"Frameshop","enabled":true},
    {"id":"contacts","label":"Contacts","enabled":true}
  ]',
  studio_tabs = '[
    {"id":"overview","label":"Overview","enabled":true},
    {"id":"submissions","label":"My submissions","enabled":true},
    {"id":"open-calls","label":"Open calls","enabled":true},
    {"id":"invitations","label":"Invitations","enabled":true},
    {"id":"profile","label":"Profile","enabled":true},
    {"id":"messages","label":"Messages","enabled":true}
  ]',
  currency_code = 'ZAR',
  submit_commission_note_template = 'The gallery commission of {rate}% will be added on top of your asking price for the final sale price shown to collectors.'
where slug = 'jvh';
