import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 *
 * La sesión viaja en cookies, así que hay que darle a Supabase una forma de
 * leerlas y escribirlas. En Next 16 `cookies()` es asíncrono, de ahí el await.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Los Server Components no pueden escribir cookies. No es un
            // problema: el proxy ya refresca la sesión en cada petición.
          }
        },
      },
    },
  );
}
