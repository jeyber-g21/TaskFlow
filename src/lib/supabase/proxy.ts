import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/** Rutas que exigen sesión iniciada. */
const RUTAS_PRIVADAS = ["/dashboard", "/projects", "/settings"];

/** Rutas de acceso: quien ya tiene sesión no pinta nada aquí. */
const RUTAS_DE_ACCESO = ["/login", "/register"];

/**
 * Se ejecuta antes de cada petición: refresca el token de sesión (que caduca
 * cada hora) y decide si la persona puede ver la ruta que pidió.
 *
 * Importante: `supabaseResponse` debe conservarse tal cual. Si se devuelve
 * una respuesta distinta sin copiarle las cookies, la sesión se pierde en
 * silencio y el usuario acaba deslogueado sin saber por qué.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() valida el token contra Supabase. No uses getSession() aquí:
  // lee la cookie sin verificarla, así que es falsificable.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esRutaPrivada = RUTAS_PRIVADAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  );

  if (!user && esRutaPrivada) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Para devolverle a donde iba una vez inicie sesión.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && RUTAS_DE_ACCESO.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
