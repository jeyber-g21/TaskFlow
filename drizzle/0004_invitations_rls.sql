-- ---------------------------------------------------------------------------
-- Invitaciones por codigo
--
-- El admin genera un codigo; quien lo tenga puede unirse al equipo con el rol
-- que se le asigno. El codigo caduca y puede revocarse.
-- ---------------------------------------------------------------------------

alter table public.invitations enable row level security;
revoke all on table public.invitations from anon;

-- Los miembros ven las invitaciones de su equipo para saber a quien se invito.
create policy "invitations_select_team"
on public.invitations for select to authenticated
using (public.is_team_member(team_id));

-- Invitar es gestionar el equipo: solo administradores.
create policy "invitations_insert_admins"
on public.invitations for insert to authenticated
with check (public.is_team_admin(team_id));

create policy "invitations_delete_admins"
on public.invitations for delete to authenticated
using (public.is_team_admin(team_id));

-- Sin politica de UPDATE: una invitacion no se edita. Se revoca y se crea otra,
-- que ademas deja el codigo viejo inservible.


-- ---------------------------------------------------------------------------
-- Unirse con un codigo
--
-- Tiene que ser SECURITY DEFINER: quien llega con el codigo todavia no
-- pertenece al equipo, asi que ninguna politica le dejaria leer la invitacion
-- ni insertarse en `memberships`. La funcion valida el codigo y hace las dos
-- cosas; fuera de ella, el codigo no da acceso a nada.
-- ---------------------------------------------------------------------------
create or replace function public.accept_invitation(invitation_token text)
returns table (team_id uuid, team_name text)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  invitacion public.invitations%rowtype;
  usuario_id uuid := auth.uid();
begin
  if usuario_id is null then
    raise exception 'Se necesita una sesion iniciada' using errcode = 'P0001';
  end if;

  select * into invitacion
  from public.invitations i
  where i.token = invitation_token;

  if not found then
    raise exception 'La invitacion no existe' using errcode = 'P0002';
  end if;

  if invitacion.accepted_at is not null then
    raise exception 'La invitacion ya se uso' using errcode = 'P0003';
  end if;

  if invitacion.expires_at < now() then
    raise exception 'La invitacion ha caducado' using errcode = 'P0004';
  end if;

  -- Quien ya pertenece al equipo no se duplica ni cambia de rol por volver a
  -- abrir el enlace: se le devuelve el equipo y listo.
  if exists (
    select 1 from public.memberships m
    where m.team_id = invitacion.team_id and m.user_id = usuario_id
  ) then
    return query
      select t.id, t.name from public.teams t where t.id = invitacion.team_id;
    return;
  end if;

  insert into public.memberships (team_id, user_id, role)
  values (invitacion.team_id, usuario_id, invitacion.role);

  -- Marcar la invitacion como usada la inutiliza para el siguiente que llegue.
  update public.invitations
  set accepted_at = now()
  where id = invitacion.id;

  return query
    select t.id, t.name from public.teams t where t.id = invitacion.team_id;
end;
$fn$;

revoke all on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;


-- ---------------------------------------------------------------------------
-- Consultar una invitacion antes de aceptarla
--
-- Para poder enseñar "Te han invitado a X" sin haber entrado todavia al
-- equipo. Devuelve lo minimo: el nombre del equipo y si el codigo sirve.
-- ---------------------------------------------------------------------------
create or replace function public.peek_invitation(invitation_token text)
returns table (team_name text, role member_role, valid boolean, reason text)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $fn$
declare
  invitacion public.invitations%rowtype;
begin
  select * into invitacion
  from public.invitations i
  where i.token = invitation_token;

  if not found then
    return query select null::text, null::member_role, false, 'no_existe'::text;
    return;
  end if;

  if invitacion.accepted_at is not null then
    return query
      select t.name, invitacion.role, false, 'ya_usada'::text
      from public.teams t where t.id = invitacion.team_id;
    return;
  end if;

  if invitacion.expires_at < now() then
    return query
      select t.name, invitacion.role, false, 'caducada'::text
      from public.teams t where t.id = invitacion.team_id;
    return;
  end if;

  return query
    select t.name, invitacion.role, true, null::text
    from public.teams t where t.id = invitacion.team_id;
end;
$fn$;

revoke all on function public.peek_invitation(text) from public;
grant execute on function public.peek_invitation(text) to authenticated;


-- ---------------------------------------------------------------------------
-- Ultimo administrador
--
-- Un equipo sin administradores no se puede gestionar: nadie podria invitar,
-- cambiar roles ni borrar el equipo. Se impide desde la base de datos y no
-- solo desde la interfaz, porque una peticion directa se la saltaria.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $fn$
declare
  equipo uuid := coalesce(old.team_id, new.team_id);
  admins_restantes int;
begin
  -- Solo importa cuando se deja de ser admin: al borrar la fila, o al cambiar
  -- el rol de admin a miembro.
  if tg_op = 'UPDATE' and not (old.role = 'admin' and new.role <> 'admin') then
    return new;
  end if;
  if tg_op = 'DELETE' and old.role <> 'admin' then
    return old;
  end if;

  select count(*) into admins_restantes
  from public.memberships m
  where m.team_id = equipo
    and m.role = 'admin'
    and m.id <> old.id;

  if admins_restantes = 0 then
    raise exception 'El equipo se quedaria sin administradores'
      using errcode = 'P0005';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$fn$;

drop trigger if exists memberships_protect_last_admin on public.memberships;

create trigger memberships_protect_last_admin
before update or delete on public.memberships
for each row execute function public.prevent_last_admin_removal();
