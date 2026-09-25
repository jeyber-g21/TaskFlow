/**
 * Supabase devuelve los errores en inglés y a veces demasiado técnicos.
 * Esto los convierte en algo que una persona pueda leer y entender qué hacer.
 *
 * Se comparan trozos del mensaje en lugar de códigos porque la librería de
 * autenticación no expone códigos estables para todos los casos.
 */
export function traducirErrorDeAuth(mensaje: string): string {
  const m = mensaje.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "El email o la contraseña no son correctos.";
  }
  if (m.includes("email not confirmed")) {
    return "Aún no has confirmado tu email. Revisa tu bandeja de entrada.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Ya existe una cuenta con ese email. Prueba a iniciar sesión.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
  }
  if (m.includes("password")) {
    return "La contraseña no cumple los requisitos mínimos.";
  }

  return "No hemos podido completar la operación. Inténtalo de nuevo.";
}
