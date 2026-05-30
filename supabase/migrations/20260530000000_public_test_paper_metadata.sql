do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'test_papers'
      and policyname = 'Anyone can view test paper metadata'
  ) then
    create policy "Anyone can view test paper metadata"
    on public.test_papers
    for select
    using (true);
  end if;
end $$;
