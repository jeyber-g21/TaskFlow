import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Destino del enlace que Supabase envía por email al registrarse.
 * Canjea el código de un solo uso por una sesión y deja al usuario dentro.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Enlace de confirmación inválido.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("El enlace ha caducado o ya se usó. Pide uno nuevo.")}`,
    );
  }

  return NextResponse.redirect(
    `${origin}${next?.startsWith("/") ? next : "/dashboard"}`,
  );
}
