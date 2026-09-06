drop policy if exists "users create reports" on public.reports;
create policy "users create reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id and public.is_active_user());
