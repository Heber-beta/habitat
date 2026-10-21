-- Hábitat: sincronizar entre dispositivos. Pegar en Supabase > SQL Editor > New query > Run.
-- Usa el mismo proyecto (y la misma cuenta) del macrociclo. Una fila por usuario con todos sus datos.
create table if not exists habitat (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now());
alter table habitat enable row level security;
drop policy if exists "propios" on habitat;
create policy "propios" on habitat for all using (user_id = auth.uid()) with check (user_id = auth.uid());
