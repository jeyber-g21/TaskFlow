import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Cliente para componentes que corren en el navegador.
 * Usa la clave anónima: es pública a propósito, porque quien limita lo que
 * puede leer o escribir cada usuario son las políticas RLS de Postgres.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
