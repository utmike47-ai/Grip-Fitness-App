-- Allow coaches to insert registrations on behalf of students
create policy "Coaches can add students"
  on public.registrations
  for insert
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'coach'
    )
  );

-- Allow coaches to delete registrations for any student
create policy "Coaches can remove students"
  on public.registrations
  for delete
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'coach'
    )
  );
