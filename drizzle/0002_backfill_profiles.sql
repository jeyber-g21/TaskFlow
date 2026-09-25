-- Los usuarios que se registraron antes de que existiera el trigger
-- `on_auth_user_created` no tienen perfil. Sin esto, la aplicacion tendria que
-- defenderse en cada consulta de un caso que solo se da por motivos historicos.
--
-- Es idempotente: si se vuelve a ejecutar, no duplica ni pisa nada.

insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(u.email, '@', 1)
  )
from auth.users u
on conflict (id) do nothing;
