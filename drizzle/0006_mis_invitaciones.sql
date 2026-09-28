-- ---------------------------------------------------------------------------
-- Invitaciones dirigidas a mi
--
-- Quien recibe una invitacion todavia no pertenece al equipo, asi que la
-- politica de SELECT sobre `invitations` no le deja ver ni la suya. Esta
-- funcion es la excepcion acotada: devuelve unicamente las invitaciones
-- pendientes cuyo email coincide con el de la sesion.
--
-- El email sale del token de la sesion (`auth.jwt()`), no de un parametro:
-- si se pasara por argumento, cualquiera podria consultar las invitaciones
-- de otra persona y averiguar a que equipos se la ha invitado.
-- ---------------------------------------------------------------------------

create or replace function public.my_pending_invitations()
returns table (
  token text,
  team_name text,
  role member_role,
  expires_at timestamptz
)
language sql
security definer
stable
set search_path = public, pg_temp
as $fn$
  select i.token, t.name, i.role, i.expires_at
  from public.invitations i
  join public.teams t on t.id = i.team_id
  where lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and i.accepted_at is null
    and i.expires_at > now()
    -- Si ya esta en el equipo, la invitacion no aporta nada.
    and not exists (
      select 1 from public.memberships m
      where m.team_id = i.team_id and m.user_id = auth.uid()
    )
  order by i.created_at desc;
$fn$;

revoke all on function public.my_pending_invitations() from public;
grant execute on function public.my_pending_invitations() to authenticated;
