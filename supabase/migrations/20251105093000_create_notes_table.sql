-- Create notes table
create table if not exists public.notes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users (id) on delete cascade,
    event_id uuid not null references public.events (id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint notes_user_event_unique unique (user_id, event_id)
);

-- Ensure row level security is enabled
alter table public.notes enable row level security;

-- Policy: users can select their own notes
create policy "Users can read own notes"
    on public.notes
    for select
    using (auth.uid() = user_id);

-- Policy: users can insert their own notes
create policy "Users can insert own notes"
    on public.notes
    for insert
    with check (auth.uid() = user_id);

-- Policy: users can update their own notes
create policy "Users can update own notes"
    on public.notes
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Policy: users can delete their own notes
create policy "Users can delete own notes"
    on public.notes
    for delete
    using (auth.uid() = user_id);
