-- Additive migration: existing projects keep their current cover photo.
alter table public.haptos_portfolio_projects
  add column image_paths text[] not null default '{}';
update public.haptos_portfolio_projects set image_paths=array[image_path];
alter table public.haptos_portfolio_projects add constraint haptos_gallery_paths
  check (cardinality(image_paths)<=8 and array_position(image_paths,null) is null
    and (cardinality(image_paths)=0 or array_to_string(image_paths,',') ~ '^[a-f0-9-]+\.webp(,[a-f0-9-]+\.webp)*$'));
