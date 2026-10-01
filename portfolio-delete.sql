-- Only authenticated Haptos administrators may permanently delete projects.
grant delete on public.haptos_portfolio_projects to authenticated;
create policy "Haptos administrators delete projects"
on public.haptos_portfolio_projects for delete to authenticated
using (exists(select 1 from public.haptos_portfolio_admins where user_id=(select auth.uid())));
