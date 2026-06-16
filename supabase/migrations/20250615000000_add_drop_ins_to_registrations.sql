-- Support non-member drop-in attendees on class rosters without user accounts.
-- Drop-ins are stored as registration rows with is_drop_in = true and nullable user_id.

alter table public.registrations
  alter column user_id drop not null;

alter table public.registrations
  add column if not exists is_drop_in boolean not null default false,
  add column if not exists drop_in_first_name text,
  add column if not exists drop_in_last_name text,
  add column if not exists drop_in_email text,
  add column if not exists drop_in_phone text,
  add column if not exists drop_in_notes text,
  add column if not exists created_by uuid references auth.users (id);

-- Members must have a user_id; drop-ins must have a name and no user_id.
alter table public.registrations
  drop constraint if exists registrations_member_or_drop_in_check;

alter table public.registrations
  add constraint registrations_member_or_drop_in_check
  check (
    (is_drop_in = false and user_id is not null)
    or (
      is_drop_in = true
      and user_id is null
      and drop_in_first_name is not null
      and trim(drop_in_first_name) <> ''
      and drop_in_last_name is not null
      and trim(drop_in_last_name) <> ''
    )
  );

-- Coaches/admins can insert drop-ins (existing "Coaches can add students" policy covers this).
-- Coaches/admins can view and remove drop-ins (existing select/delete policies cover this).
-- Drop-ins have no auth account and therefore no login access.
