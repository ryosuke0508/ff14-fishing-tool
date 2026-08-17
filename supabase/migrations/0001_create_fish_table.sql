-- 魚テーブル
create table public.fish (
  id uuid primary key default gen_random_uuid(),  -- レコードID(主キー)
  name text not null,                             -- 魚名
  is_nushi boolean not null default false,        -- ヌシかどうか（true/false、デフォルトfalse）
  area text not null,                             -- 釣れるエリア
  fishing_spot text,                              -- 釣り場（エリアより詳細な、具体的な釣りポイント名）
  time_range text,                                -- 釣れる時間帯（エオルゼア時間）
  weather text,                                   -- 必要な天候
  remarks text,                                   -- 備考
  xivapi_item_id integer unique,                  -- XIVAPIのItem行ID
  created_at timestamptz not null default now(),  -- 作成日時
  updated_at timestamptz not null default now()   -- 更新日時
);

-- 更新のたびに自動でセットするトリガー
create function public.set_fish_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger fish_set_updated_at
before update on public.fish
for each row
execute function public.set_fish_updated_at();

alter table public.fish enable row level security;

-- RLS（Row Level Security）を有効化し、「誰でも読み取りだけは可能」とする。
create policy "Allow public read access"
on public.fish
for select
to anon, authenticated
using (true);
