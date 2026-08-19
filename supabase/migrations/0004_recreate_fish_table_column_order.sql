drop table if exists public.fish;

create table public.fish (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_nushi boolean not null default false,
  area text not null,
  fishing_spot text,
  time_from time,
  time_to time,
  weather text,
  bait text,
  remarks text,
  xivapi_item_id integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger fish_set_updated_at
before update on public.fish
for each row
execute function public.set_fish_updated_at();

alter table public.fish enable row level security;

create policy "Allow public read access"
on public.fish
for select
to anon, authenticated
using (true);

grant select on public.fish to anon, authenticated;
