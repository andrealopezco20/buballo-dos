create table if not exists public.eventos (
  id text primary key,
  nombre text not null,
  clan text not null,
  "clanColor" text,
  categoria text default 'General',
  fecha date not null,
  hora time not null,
  descripcion text not null,
  lugar text default 'Bubaloo',
  estado text not null,
  destacado boolean default false,
  "createdAt" timestamptz default now()
);

alter table public.eventos enable row level security;

-- Politicas basicas para demo publica (lectura/escritura con anon)
-- Si quieres mas seguridad, cambia estas politicas luego.
create policy if not exists "eventos_select_anon"
on public.eventos for select
using (true);

create policy if not exists "eventos_insert_anon"
on public.eventos for insert
with check (true);

create policy if not exists "eventos_update_anon"
on public.eventos for update
using (true)
with check (true);

create policy if not exists "eventos_delete_anon"
on public.eventos for delete
using (true);
