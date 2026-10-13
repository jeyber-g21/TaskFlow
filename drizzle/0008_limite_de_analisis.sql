-- ---------------------------------------------------------------------------
-- Limite diario de analisis con IA
--
-- Cada analisis es una llamada de pago a la API de Anthropic y la demo es
-- publica: sin un tope, cualquiera podria crear cuentas y agotar el saldo.
-- El limite se aplica aqui y no en la aplicacion por la misma razon que el
-- resto de permisos: una peticion que se salte la interfaz tampoco lo evita.
-- ---------------------------------------------------------------------------

alter table public.board_analyses enable row level security;
revoke all on table public.board_analyses from anon;

-- Los miembros ven los analisis de su equipo, para saber cuantos quedan.
create policy "board_analyses_select_members"
on public.board_analyses for select to authenticated
using (public.is_team_member(team_id));

-- Sin politicas de INSERT, UPDATE ni DELETE: nadie puede apuntarse un
-- analisis, ni borrar los suyos para recuperar cupo. Las filas solo nacen en
-- `claim_board_analysis()`, que comprueba el limite en la misma operacion.


-- ---------------------------------------------------------------------------
-- Reservar un analisis
--
-- Devuelve cuantos analisis le quedan al equipo despues de este. Si el
-- proyecto no es del equipo, falla igual que si no existiera (42501). Si ya
-- se gasto el cupo, falla con el codigo propio TF429.
--
-- El bloqueo consultivo serializa las reservas de un mismo equipo: sin el,
-- dos peticiones simultaneas podrian contar 4, pasar las dos y dejar el
-- equipo en 6.
--
-- El 5 tiene que coincidir con LIMITE_DIARIO_ANALISIS en
-- src/lib/analisis/limite.ts, que es lo que se muestra en el tablero.
-- ---------------------------------------------------------------------------
create or replace function public.claim_board_analysis(target_project_id uuid)
returns integer
language plpgsql
security definer
volatile
set search_path = public, pg_temp
as $fn$
declare
  limite constant integer := 5;
  equipo uuid;
  usados integer;
begin
  select p.team_id into equipo
  from public.projects p
  where p.id = target_project_id;

  if equipo is null or not public.is_team_member(equipo) then
    raise exception 'proyecto no encontrado' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('board_analyses:' || equipo::text, 0));

  select count(*) into usados
  from public.board_analyses a
  where a.team_id = equipo
    and a.created_at > now() - interval '24 hours';

  if usados >= limite then
    raise exception 'limite diario de analisis alcanzado' using errcode = 'TF429';
  end if;

  insert into public.board_analyses (team_id, project_id, user_id)
  values (equipo, target_project_id, auth.uid());

  return limite - usados - 1;
end;
$fn$;

revoke all on function public.claim_board_analysis(uuid) from public;
grant execute on function public.claim_board_analysis(uuid) to authenticated;
