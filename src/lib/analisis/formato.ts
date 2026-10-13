/** Los títulos de las secciones que se le piden a Claude. */
export const SECCIONES = ["Resumen", "Riesgos", "Siguientes pasos"] as const;

export type Bloque =
  | { tipo: "titulo"; texto: string }
  | { tipo: "punto"; texto: string }
  | { tipo: "parrafo"; texto: string };

const TITULOS = new Set<string>(SECCIONES);

/**
 * Convierte el texto del análisis en bloques para pintarlo.
 *
 * Se le pide a Claude texto plano con una estructura fija en vez de Markdown:
 * así no hace falta un intérprete de Markdown ni inyectar HTML generado, y
 * funciona igual con el texto a medio llegar.
 */
export function interpretarAnalisis(texto: string): Bloque[] {
  const bloques: Bloque[] = [];

  for (const cruda of texto.split("\n")) {
    const linea = cruda.trim();
    if (!linea) continue;

    // Por si acaso llega con algo de Markdown pese a las instrucciones.
    const sinAdornos = linea.replace(/^#+\s*/, "").replace(/\*\*/g, "");
    const comoTitulo = sinAdornos.replace(/:$/, "");

    if (TITULOS.has(comoTitulo)) {
      bloques.push({ tipo: "titulo", texto: comoTitulo });
    } else if (/^[•\-*]\s+/.test(sinAdornos)) {
      bloques.push({ tipo: "punto", texto: sinAdornos.replace(/^[•\-*]\s+/, "") });
    } else {
      bloques.push({ tipo: "parrafo", texto: sinAdornos });
    }
  }

  return bloques;
}
