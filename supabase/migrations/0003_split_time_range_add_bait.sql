alter table public.fish
  drop column time_range,
  add column time_from time,
  add column time_to time,
  add column bait text;
