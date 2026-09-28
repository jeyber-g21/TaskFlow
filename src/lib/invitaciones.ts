/**
 * Genera el código que viaja en el enlace de invitación.
 *
 * Usa el generador criptográfico del sistema y no Math.random: quien adivine
 * un código entra en el equipo, así que tiene que ser impredecible.
 *
 * 24 bytes en base64url dan 32 caracteres sin símbolos raros que se rompan al
 * pegarlos en una URL o en un chat.
 */
export function generarCodigo(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);

  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** El enlace completo que se comparte. */
export function enlaceDeInvitacion(origen: string, codigo: string): string {
  return `${origen}/unirse/${codigo}`;
}
