-- Supabase RLS template for the future multi-device Event platform.
-- Apply after creating equivalent remote tables in Supabase.

create table if not exists user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null,
  record_id text not null,
  action text not null default 'upsert',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, record_id)
);

alter table if exists event_categories enable row level security;
alter table if exists events enable row level security;
alter table if exists user_preferences enable row level security;
alter table if exists sync_records enable row level security;
alter table if exists user_data enable row level security;

create policy if not exists "Users can read own categories"
on event_categories for select
using (auth.uid() = user_id);

create policy if not exists "Users can write own categories"
on event_categories for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users can read own events"
on events for select
using (auth.uid() = user_id);

create policy if not exists "Users can write own events"
on events for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users can read own preferences"
on user_preferences for select
using (auth.uid() = user_id);

create policy if not exists "Users can write own preferences"
on user_preferences for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users can read own sync records"
on sync_records for select
using (auth.uid() = user_id);

create policy if not exists "Users can write own sync records"
on sync_records for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users can read own user data"
on user_data for select
using (auth.uid() = user_id);

create policy if not exists "Users can write own user data"
on user_data for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
