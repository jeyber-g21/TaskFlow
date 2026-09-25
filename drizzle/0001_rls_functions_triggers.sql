-- ---------------------------------------------------------------------------
-- Permisos a nivel de base de datos (Row Level Security)
--
-- La idea: aunque alguien se salte por completo la interfaz y llame a la API
-- con su propia clave, Postgres solo le devolvera filas de los equipos a los
-- que pertenece. Esconder botones en el front no es seguridad.
-- ---------------------------------------------------------------------------


-- ============================ FUNCIONES DE APOYO ===========================
--
-- Son SECURITY DEFINER a proposito. Si una politica sobre `memberships`
-- consultara `memberships` directamente, Postgres volveria a evaluar la misma
-- politica para esa consulta y entraria en recursion infinita. Al ejecutarse
-- con los permisos del propietario, estas funciones leen la tabla sin
-- reactivar RLS y cortan el ciclo.
--
-- `set search_path` evita que alguien las engane creando objetos con el mismo
-- nombre en un esquema que se resuelva antes.

create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1
    from public.memberships m
    where m.team_id = target_team_id
      and m.user_id = auth.uid()
  );
$fn$;

create or replace function public.is_team_admin(target_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1
    from public.memberships m
    where m.team_id = target_team_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  );
$fn$;

-- Las tareas cuelgan de un proyecto, y el proyecto de un equipo. Esta funcion
-- resuelve ese salto para no repetir el join en cada politica de `tasks`.
create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1
    from public.projects p
    join public.memberships m on m.team_id = p.team_id
    where p.id = target_project_id
      and m.user_id = auth.uid()
  );
$fn$;

-- Para poder ver el nombre de los companeros de equipo, y de nadie mas.
create or replace function public.shares_team_with(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.team_id = mine.team_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_user_id
  );
$fn$;

-- Por defecto Postgres concede EXECUTE a todo el mundo. Al ser funciones con
-- privilegios elevados, se limita el acceso a quien tenga sesion iniciada.
revoke all on function public.is_team_member(uuid) from public;
revoke all on function public.is_team_admin(uuid) from public;
revoke all on function public.is_project_member(uuid) from public;
revoke all on function public.shares_team_with(uuid) from public;

grant execute on function public.is_team_member(uuid) to authenticated, service_role;
grant execute on function public.is_team_admin(uuid) to authenticated, service_role;
grant execute on function public.is_project_member(uuid) to authenticated, service_role;
grant execute on function public.shares_team_with(uuid) to authenticated, service_role;


-- ================================ TRIGGERS =================================

-- El perfil se crea solo al registrarse. Si lo insertara la aplicacion
-- existiria una ventana en la que el usuario ya puede entrar pero aun no
-- tiene perfil, y habria que defenderse de ese estado en cada consulta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    -- Si el registro no trajo nombre, se usa la parte local del email en
    -- lugar de dejar el perfil a medias.
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- `updated_at` se mantiene en la base de datos y no en la aplicacion: asi
-- ninguna ruta puede olvidarse de actualizarlo.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists tasks_set_updated_at on public.tasks;

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();


-- ============================ CREACION DE EQUIPO ===========================
--
-- Crear un equipo y hacerse su administrador es una sola operacion: si se
-- permitiera insertar en `teams` directamente, existiria un instante con un
-- equipo sin nadie dentro, y ninguna politica podria distinguir si quien
-- anade el primer miembro tiene derecho a hacerlo.
create or replace function public.create_team(team_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  new_team_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Se necesita una sesion iniciada para crear un equipo';
  end if;

  if coalesce(trim(team_name), '') = '' then
    raise exception 'El nombre del equipo no puede estar vacio';
  end if;

  insert into public.teams (name)
  values (trim(team_name))
  returning id into new_team_id;

  insert into public.memberships (team_id, user_id, role)
  values (new_team_id, current_user_id, 'admin');

  return new_team_id;
end;
$fn$;

revoke all on function public.create_team(text) from public;
grant execute on function public.create_team(text) to authenticated;


-- ================================ POLITICAS ================================

alter table public.profiles    enable row level security;
alter table public.teams       enable row level security;
alter table public.memberships enable row level security;
alter table public.projects    enable row level security;
alter table public.tasks       enable row level security;

-- Nadie sin sesion toca nada. Las politicas son todas `to authenticated`, asi
-- que esto es redundante; se deja como segunda barrera explicita.
revoke all on table public.profiles    from anon;
revoke all on table public.teams       from anon;
revoke all on table public.memberships from anon;
revoke all on table public.projects    from anon;
revoke all on table public.tasks       from anon;


-- ---- profiles -------------------------------------------------------------
-- No hay politica de INSERT: los perfiles solo nacen del trigger.
-- Tampoco de DELETE: se borran en cascada al borrarse el usuario.

create policy "profiles_select_self_or_teammates"
on public.profiles for select to authenticated
using (id = auth.uid() or public.shares_team_with(id));

create policy "profiles_update_self"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());


-- ---- teams ----------------------------------------------------------------
-- Sin politica de INSERT: los equipos se crean con public.create_team().

create policy "teams_select_members"
on public.teams for select to authenticated
using (public.is_team_member(id));

create policy "teams_update_admins"
on public.teams for update to authenticated
using (public.is_team_admin(id))
with check (public.is_team_admin(id));

create policy "teams_delete_admins"
on public.teams for delete to authenticated
using (public.is_team_admin(id));


-- ---- memberships ----------------------------------------------------------

create policy "memberships_select_team"
on public.memberships for select to authenticated
using (public.is_team_member(team_id));

create policy "memberships_insert_admins"
on public.memberships for insert to authenticated
with check (public.is_team_admin(team_id));

create policy "memberships_update_admins"
on public.memberships for update to authenticated
using (public.is_team_admin(team_id))
with check (public.is_team_admin(team_id));

-- Un administrador puede expulsar a alguien; cualquiera puede irse del equipo.
create policy "memberships_delete_admins_or_self"
on public.memberships for delete to authenticated
using (public.is_team_admin(team_id) or user_id = auth.uid());


-- ---- projects -------------------------------------------------------------
-- Cualquier miembro crea y edita proyectos; borrarlos se queda en los admins,
-- porque se lleva por delante todas sus tareas.

create policy "projects_select_members"
on public.projects for select to authenticated
using (public.is_team_member(team_id));

create policy "projects_insert_members"
on public.projects for insert to authenticated
with check (public.is_team_member(team_id));

create policy "projects_update_members"
on public.projects for update to authenticated
using (public.is_team_member(team_id))
with check (public.is_team_member(team_id));

create policy "projects_delete_admins"
on public.projects for delete to authenticated
using (public.is_team_admin(team_id));


-- ---- tasks ----------------------------------------------------------------
-- Colaborar es el caso normal: cualquier miembro del equipo dueno del
-- proyecto puede crear, mover y borrar tareas.

create policy "tasks_select_members"
on public.tasks for select to authenticated
using (public.is_project_member(project_id));

create policy "tasks_insert_members"
on public.tasks for insert to authenticated
with check (public.is_project_member(project_id));

create policy "tasks_update_members"
on public.tasks for update to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "tasks_delete_members"
on public.tasks for delete to authenticated
using (public.is_project_member(project_id));
