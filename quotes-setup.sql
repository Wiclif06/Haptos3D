-- Haptos quote history: private, using the existing administrator membership.
create table public.haptos_quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null check (char_length(number) between 1 and 60),
  customer text not null check (char_length(customer) between 1 and 150),
  total numeric(14,2) not null check (total >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 6000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.haptos_quotes enable row level security;
revoke all on public.haptos_quotes from anon, authenticated;
grant select, insert, update on public.haptos_quotes to authenticated;
create index haptos_quotes_updated on public.haptos_quotes(updated_at desc, id);
create policy "Haptos administrators read quotes" on public.haptos_quotes for select to authenticated
using (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
create policy "Haptos administrators create quotes" on public.haptos_quotes for insert to authenticated
with check (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
create policy "Haptos administrators edit quotes" on public.haptos_quotes for update to authenticated
using (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())))
with check (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
