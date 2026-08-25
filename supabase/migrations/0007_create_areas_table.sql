create table public.areas (
  id integer primary key,               -- FishingSpot.PlaceNameのrow_id（従来のfish.area_idと同じ値）
  area text not null,                   -- 釣れるエリア（PlaceName文字列の「：」より前）
  fishing_spot text,                    -- 釣り場（PlaceName文字列の「：」より後、ない場合はnull）
  region text,                          -- 地域（TerritoryType.PlaceNameZone、例: リムサ・ロミンサ市街）
  region_id integer,                    -- 地域のXIVAPI PlaceName ID
  greater_region text,                  -- より広い地方区分（TerritoryType.PlaceNameRegion、例: ラノシア）
  greater_region_id integer,            -- より広い地方区分のXIVAPI PlaceName ID
  expansion text,                       -- 拡張パッケージ（TerritoryType.ExVersion、例: 新生エオルゼア、蒼天のイシュガルド）
  expansion_id integer                  -- 拡張パッケージのXIVAPI ExVersion ID
);

alter table public.areas enable row level security;

create policy "Allow public read access"
on public.areas
for select
to anon, authenticated
using (true);

grant select on public.areas to anon, authenticated;
