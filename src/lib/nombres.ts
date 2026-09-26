/**
 * Función de presentación, sin dependencias: vive fuera del módulo de
 * consultas porque ese es `server-only` y arrastraría el cliente de Supabase
 * a cualquier sitio que solo quiera formatear un nombre.
 */

/** "Jeyber Gómez García" → "JG". Dos letras como mucho. */
export function calcularIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? "")
    .join("");
}
