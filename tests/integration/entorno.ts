import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Lee `.env.local` para los tests de integración.
 *
 * Se hace a mano en lugar de usar el cargador de Next porque ese cachea y
 * dentro de Vitest acaba devolviendo un entorno vacío, sin avisar.
 *
 * Las variables que ya existen NO se pisan: en CI llegan desde los secretos
 * del repositorio y deben tener prioridad sobre cualquier archivo local.
 */
export function cargarEntornoLocal(): void {
  const ruta = resolve(process.cwd(), ".env.local");
  if (!existsSync(ruta)) return;

  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;

    const separador = limpia.indexOf("=");
    if (separador === -1) continue;

    const clave = limpia.slice(0, separador).trim();
    let valor = limpia.slice(separador + 1).trim();

    const entrecomillado =
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"));
    if (entrecomillado) valor = valor.slice(1, -1);

    if (!process.env[clave]) process.env[clave] = valor;
  }
}
