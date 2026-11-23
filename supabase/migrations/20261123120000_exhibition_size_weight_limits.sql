-- Structured size and weight limits per exhibition. NULL means no limit.
-- size_requirements stays for free-text notes entered before these existed.

alter table public.exhibitions
  add column max_height_cm numeric(8,2) check (max_height_cm > 0),
  add column max_length_cm numeric(8,2) check (max_length_cm > 0),
  add column max_width_cm numeric(8,2) check (max_width_cm > 0),
  add column max_weight_excl_packaging_kg numeric(8,2) check (max_weight_excl_packaging_kg > 0),
  add column max_weight_incl_packaging_kg numeric(8,2) check (max_weight_incl_packaging_kg > 0);
