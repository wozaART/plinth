-- Galleries provisioned by handle_new_user() only set owner/slug/name/city, so
-- theme_colors / gallery_tabs / studio_tabs fell back to '{}' / '[]'. The
-- portal reads theme_colors.status.* and the nav tabs on every request, so a
-- freshly created gallery crashed the dashboard. Give those columns the
-- standard Woza look as their default and backfill any gallery still empty.

alter table public.galleries
  alter column theme_colors set default '{
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
  }'::jsonb,
  alter column gallery_tabs set default '[
    {"id":"submissions","label":"Submissions","enabled":true},
    {"id":"exhibitions","label":"Exhibitions","enabled":true},
    {"id":"catalogue","label":"Catalogue","enabled":true},
    {"id":"contacts","label":"Contacts","enabled":true},
    {"id":"frameshop","label":"Frameshop","enabled":false}
  ]'::jsonb,
  alter column studio_tabs set default '[
    {"id":"overview","label":"Overview","enabled":true},
    {"id":"submissions","label":"My submissions","enabled":true},
    {"id":"open-calls","label":"Open calls","enabled":true},
    {"id":"invitations","label":"Invitations","enabled":true},
    {"id":"messages","label":"Messages","enabled":true},
    {"id":"profile","label":"Profile","enabled":false},
    {"id":"catalogue","label":"Works at the gallery","enabled":true}
  ]'::jsonb;

update public.galleries set theme_colors = default where theme_colors = '{}'::jsonb;
update public.galleries set gallery_tabs = default where gallery_tabs = '[]'::jsonb;
update public.galleries set studio_tabs = default where studio_tabs = '[]'::jsonb;
