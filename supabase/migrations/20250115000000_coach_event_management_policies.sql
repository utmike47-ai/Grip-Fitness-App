-- Allow coaches and admins to insert events
create policy "Coaches and admins can create events"
  on public.events
  for insert
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('coach', 'admin')
    )
  );

-- Allow coaches and admins to update events
create policy "Coaches and admins can update events"
  on public.events
  for update
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('coach', 'admin')
    )
  );

-- Allow coaches and admins to delete events
create policy "Coaches and admins can delete events"
  on public.events
  for delete
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('coach', 'admin')
    )
  );
