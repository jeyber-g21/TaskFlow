import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Destino de los enlaces que Supabase envía por correo: confirmación de
 * cuenta y cambio de contraseña. Canjea el código de un solo uso por una
 * sesión y deja a la persona donde corresponda.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorDeSupabase = searchParams.get("error_code");

  const destinoSiFalla = (mensaje: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(mensaje)}`);

  // Supabase puede rechazar el enlace antes de llegar aquí y avisar por la
  // URL. Sin esto, la persona aterrizaba en la portada con un churro de
  // parámetros y sin saber qué había pasado.
  if (errorDeSupabase) {
    return destinoSiFalla(traducirErrorDelEnlace(errorDeSupabase));
  }

  if (!code) {
    return destinoSiFalla("Ese enlace no es válido. Pide uno nuevo.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return destinoSiFalla(
      "El enlace ha caducado o ya se usó. Pide uno nuevo.",
    );
  }

  return NextResponse.redirect(
    `${origin}${next?.startsWith("/") ? next : "/dashboard"}`,
  );
}

function traducirErrorDelEnlace(codigo: string): string {
  switch (codigo) {
    case "otp_expired":
      return "El enlace ha caducado o ya se usó. Pide uno nuevo.";
    case "access_denied":
      return "No hemos podido validar ese enlace. Pide uno nuevo.";
    default:
      return "Ese enlace no es válido. Pide uno nuevo.";
  }
}
