-- Apply once to the existing FWERP Supabase project; only Haptos resources are added.
create table public.haptos_portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.haptos_portfolio_admins enable row level security;
revoke all on public.haptos_portfolio_admins from anon, authenticated;
grant select on public.haptos_portfolio_admins to authenticated;
create policy "Haptos administrators can check their own membership"
on public.haptos_portfolio_admins for select to authenticated using (user_id=(select auth.uid()));

create table public.haptos_portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null check (char_length(trim(description)) between 1 and 1800),
  image_path text not null check (image_path ~ '^[a-f0-9-]+\.webp$'),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.haptos_portfolio_projects enable row level security;
revoke all on public.haptos_portfolio_projects from anon, authenticated;
grant select on public.haptos_portfolio_projects to anon, authenticated;
grant insert, update on public.haptos_portfolio_projects to authenticated;
create index portfolio_public_order on public.haptos_portfolio_projects (created_at desc, id) where published;
create policy "Haptos visitors see published projects" on public.haptos_portfolio_projects
for select to anon, authenticated using (published);
create policy "Haptos administrators see all projects" on public.haptos_portfolio_projects
for select to authenticated using (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
create policy "Haptos administrators create projects" on public.haptos_portfolio_projects
for insert to authenticated with check (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
create policy "Haptos administrators edit projects" on public.haptos_portfolio_projects
for update to authenticated using (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())))
with check (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('haptos-portfolio','haptos-portfolio',true,5242880,array['image/webp']);
create policy "Haptos administrators upload portfolio photos" on storage.objects
for insert to authenticated with check (bucket_id='haptos-portfolio' and exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
create policy "Haptos administrators inspect portfolio photos" on storage.objects
for select to authenticated using (bucket_id='haptos-portfolio' and exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
create policy "Haptos administrators clean failed uploads" on storage.objects
for delete to authenticated using (bucket_id='haptos-portfolio' and exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
