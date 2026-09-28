-- ---------------------------------------------------------------------------
-- Traspaso de administracion
--
-- La version anterior impedia borrar la ultima membresia de administrador.
-- El problema: al eliminar una cuenta de usuario, la cascada intenta borrar
-- sus membresias, el trigger lo aborta y la cuenta no se puede borrar. Nadie
-- podria darse de baja.
--
-- El planteamiento nuevo distingue entre las dos situaciones:
--
--   · Dejar de ser administrador (UPDATE) es una decision deliberada: si no
--     queda nadie mas al mando, se rechaza y se explica por que.
--
--   · Irse del equipo (DELETE) no deberia fallar nunca, porque tambien ocurre
--     al borrar una cuenta. Si quien se va era el ultimo administrador, la
--     administracion pasa al miembro mas antiguo. Y si no queda nadie, el
--     equipo se queda vacio sin mas.
-- ---------------------------------------------------------------------------

create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  equipo uuid := coalesce(old.team_id, new.team_id);
  admins_restantes int;
  heredero uuid;
begin
  -- Solo interesa cuando alguien deja de ser administrador.
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

  if admins_restantes > 0 then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'UPDATE' then
    raise exception 'El equipo se quedaria sin administradores'
      using errcode = 'P0005';
  end if;

  -- A partir de aqui: se va el ultimo administrador. Se asciende a quien lleve
  -- mas tiempo en el equipo, que es el criterio menos arbitrario disponible.
  select m.id into heredero
  from public.memberships m
  where m.team_id = equipo
    and m.id <> old.id
  order by m.created_at asc
  limit 1;

  if heredero is not null then
    update public.memberships
    set role = 'admin'
    where id = heredero;
  end if;

  -- Sin heredero el equipo se queda vacio. No se borra aqui: hacerlo dentro
  -- del trigger que borra sus membresias complica el orden de las cascadas.
  return old;
end;
$fn$;
