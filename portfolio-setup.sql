-- Apply once to the dedicated Haptos Supabase project.
create table public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;
grant select on public.portfolio_admins to authenticated;
create policy "Administrators can check their own membership"
on public.portfolio_admins for select to authenticated using (user_id=(select auth.uid()));

create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null check (char_length(trim(description)) between 1 and 1800),
  image_path text not null check (image_path ~ '^[a-f0-9-]+\.webp$'),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.portfolio_projects enable row level security;
revoke all on public.portfolio_projects from anon, authenticated;
grant select on public.portfolio_projects to anon, authenticated;
grant insert, update on public.portfolio_projects to authenticated;
create index portfolio_public_order on public.portfolio_projects (created_at desc, id) where published;
create policy "Visitors see published projects" on public.portfolio_projects
for select to anon, authenticated using (published);
create policy "Administrators see all projects" on public.portfolio_projects
for select to authenticated using (exists(select 1 from public.portfolio_admins where user_id=(select auth.uid())));
create policy "Administrators create projects" on public.portfolio_projects
for insert to authenticated with check (exists(select 1 from public.portfolio_admins where user_id=(select auth.uid())));
create policy "Administrators edit projects" on public.portfolio_projects
for update to authenticated using (exists(select 1 from public.portfolio_admins where user_id=(select auth.uid())))
with check (exists(select 1 from public.portfolio_admins where user_id=(select auth.uid())));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio','portfolio',true,5242880,array['image/webp']);
create policy "Administrators upload portfolio photos" on storage.objects
for insert to authenticated with check (bucket_id='portfolio' and exists(select 1 from public.portfolio_admins where user_id=(select auth.uid())));
create policy "Administrators inspect portfolio photos" on storage.objects
for select to authenticated using (bucket_id='portfolio' and exists(select 1 from public.portfolio_admins where user_id=(select auth.uid())));
create policy "Administrators clean failed uploads" on storage.objects
for delete to authenticated using (bucket_id='portfolio' and exists(select 1 from public.portfolio_admins where user_id=(select auth.uid())));
