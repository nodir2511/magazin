create table if not exists public.store_state (
    id text primary key,
    data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('admin', 'manager')),
    created_at timestamptz not null default now()
);

create table if not exists public.store_changes (
    id bigint generated always as identity primary key,
    created_at timestamptz not null default now(),
    user_id uuid not null references auth.users(id) on delete cascade,
    user_email text not null,
    action text not null,
    details text not null default ''
);

insert into public.store_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', false)
on conflict (id) do nothing;

alter table public.store_state enable row level security;
alter table public.user_roles enable row level security;
alter table public.store_changes enable row level security;

drop policy if exists "store_state_select" on public.store_state;
drop policy if exists "store_state_insert" on public.store_state;
drop policy if exists "store_state_update" on public.store_state;
drop policy if exists "user_roles_select_own" on public.user_roles;
drop policy if exists "store_changes_select" on public.store_changes;
drop policy if exists "store_changes_insert" on public.store_changes;
drop policy if exists "product_photos_select" on storage.objects;
drop policy if exists "product_photos_insert" on storage.objects;
drop policy if exists "product_photos_update" on storage.objects;
drop policy if exists "product_photos_delete" on storage.objects;

create policy "store_state_select"
on public.store_state
for select
to authenticated
using (id = 'main');

create policy "user_roles_select_own"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

create policy "store_changes_select"
on public.store_changes
for select
to authenticated
using (true);

create policy "product_photos_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'product-photos');

create policy "product_photos_insert"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'product-photos'
    and exists (
        select 1 from public.user_roles
        where user_id = auth.uid()
        and role in ('admin', 'manager')
    )
);

create policy "product_photos_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-photos')
with check (
    bucket_id = 'product-photos'
    and exists (
        select 1 from public.user_roles
        where user_id = auth.uid()
        and role in ('admin', 'manager')
    )
);

-- After creating your first Supabase Auth user, run this once with that user's id:
-- insert into public.user_roles (user_id, role)
-- values ('USER_UUID_HERE', 'admin')
-- on conflict (user_id) do update set role = excluded.role;
