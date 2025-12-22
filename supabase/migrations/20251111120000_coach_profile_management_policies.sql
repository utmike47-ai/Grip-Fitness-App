-- Allow coaches/admins to view all profiles
create policy "Coaches can view all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('coach', 'admin')
    )
  );

-- Allow coaches/admins to update any profile
create policy "Coaches can update profiles"
  on public.profiles
  for update
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('coach', 'admin')
    )
  );

-- Allow coaches/admins to delete profiles
create policy "Coaches can delete profiles"
  on public.profiles
  for delete
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('coach', 'admin')
    )
  );

