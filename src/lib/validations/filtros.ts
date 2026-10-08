import { z } from "zod";

import { taskPriorityEnum } from "@/lib/validations/task";

/** Valor que usan los desplegables para "no filtrar por esto". */
export const TODOS = "todos";

/** Quien no tiene a nadie asignado. */
export const SIN_RESPONSABLE = "sin-responsable";

/**
 * Los filtros viajan en la URL y no en el estado de un componente.
 *
 * Así un tablero filtrado se puede compartir por chat, sobrevive a recargar la
 * página y el botón de atrás hace lo que se espera. Como vienen de fuera, hay
 * que validarlos igual que cualquier otra entrada.
 */
export const filtrosSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  prioridad: z
    .union([taskPriorityEnum, z.literal(TODOS)])
    // `catch` evita que una URL manipulada rompa la página: ante algo
    // inesperado se cae al valor por defecto y se sigue.
    .catch(TODOS),
  responsable: z.string().catch(TODOS),
});

export type Filtros = z.infer<typeof filtrosSchema>;

export function leerFiltros(
  searchParams: Record<string, string | string[] | undefined>,
): Filtros {
  const unValor = (valor: string | string[] | undefined) =>
    Array.isArray(valor) ? valor[0] : valor;

  return filtrosSchema.parse({
    q: unValor(searchParams.q) ?? "",
    prioridad: unValor(searchParams.prioridad) ?? TODOS,
    responsable: unValor(searchParams.responsable) ?? TODOS,
  });
}

export function hayFiltrosActivos(filtros: Filtros): boolean {
  return (
    filtros.q !== "" ||
    filtros.prioridad !== TODOS ||
    filtros.responsable !== TODOS
  );
}
