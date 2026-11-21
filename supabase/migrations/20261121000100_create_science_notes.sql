-- Private PDF library for Class 9 and Class 10 Science.
-- Add Auth user UUIDs to public.admin_users from the Supabase SQL editor after creating users.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;

create or replace function public.is_science_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_science_admin() from public;
grant execute on function public.is_science_admin() to anon, authenticated;

create table if not exists public.science_notes (
  id uuid primary key default gen_random_uuid(),
  class_level smallint not null check (class_level in (9, 10)),
  chapter_number smallint not null,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 500),
  file_path text not null unique,
  file_size bigint not null check (file_size > 0),
  uploaded_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  constraint science_notes_chapter_number_valid check (
    (class_level = 9 and chapter_number between 1 and 12)
    or (class_level = 10 and chapter_number between 1 and 16)
  )
);

create index if not exists science_notes_public_chapter_idx
  on public.science_notes (class_level, chapter_number, uploaded_at desc)
  where is_published = true;

alter table public.science_notes enable row level security;
revoke all on table public.science_notes from anon, authenticated;
grant select on table public.science_notes to anon, authenticated;
grant insert, update, delete on table public.science_notes to authenticated;

drop policy if exists "students read published science notes" on public.science_notes;
create policy "students read published science notes"
  on public.science_notes for select to anon, authenticated
  using (is_published = true or (select public.is_science_admin()));

drop policy if exists "admins insert science notes" on public.science_notes;
create policy "admins insert science notes"
  on public.science_notes for insert to authenticated
  with check ((select public.is_science_admin()) and created_by = (select auth.uid()));

drop policy if exists "admins update science notes" on public.science_notes;
create policy "admins update science notes"
  on public.science_notes for update to authenticated
  using ((select public.is_science_admin()))
  with check ((select public.is_science_admin()));

drop policy if exists "admins delete science notes" on public.science_notes;
create policy "admins delete science notes"
  on public.science_notes for delete to authenticated
  using ((select public.is_science_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('science-notes', 'science-notes', false, 52428800, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "students read published science note files" on storage.objects;
create policy "students read published science note files"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'science-notes'
    and (
      (select public.is_science_admin())
      or exists (
        select 1 from public.science_notes n
        where n.file_path = storage.objects.name and n.is_published = true
      )
    )
  );

drop policy if exists "admins upload science note files" on storage.objects;
create policy "admins upload science note files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'science-notes' and (select public.is_science_admin()));

drop policy if exists "admins update science note files" on storage.objects;
create policy "admins update science note files"
  on storage.objects for update to authenticated
  using (bucket_id = 'science-notes' and (select public.is_science_admin()))
  with check (bucket_id = 'science-notes' and (select public.is_science_admin()));

drop policy if exists "admins delete science note files" on storage.objects;
create policy "admins delete science note files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'science-notes' and (select public.is_science_admin()));
