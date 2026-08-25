-- fishテーブルのarea/fishing_spotはareasテーブルに移したため削除し、
-- area_idをareasテーブルへの外部キーにする
alter table public.fish
  drop column area,
  drop column fishing_spot,
  add constraint fish_area_id_fkey foreign key (area_id) references public.areas(id);
