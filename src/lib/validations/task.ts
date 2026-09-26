import { z } from "zod";

import { taskPriority, taskStatus } from "@/lib/db/schema";

/**
 * Los valores posibles de estado y prioridad salen del esquema de la base de
 * datos, no de una lista escrita a mano aquí: si mañana se añade una columna
 * al tablero, este esquema se entera solo.
 */
export const taskStatusEnum = z.enum(taskStatus.enumValues);
export const taskPriorityEnum = z.enum(taskPriority.enumValues);

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { message: "El título necesita al menos 2 caracteres." })
    .max(120, { message: "El título no puede pasar de 120 caracteres." }),
  description: z
    .string()
    .trim()
    .max(1000, { message: "La descripción no puede pasar de 1000 caracteres." })
    .transform((valor) => (valor === "" ? null : valor))
    .nullable(),
  status: taskStatusEnum,
  priority: taskPriorityEnum,
  // El desplegable envía "" cuando se elige "Sin asignar".
  assigneeId: z
    .string()
    .transform((valor) => (valor === "" ? null : valor))
    .nullable()
    .refine(
      (valor) =>
        valor === null ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor),
      { message: "El responsable seleccionado no es válido." },
    ),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskStatusValue = z.infer<typeof taskStatusEnum>;
export type TaskPriorityValue = z.infer<typeof taskPriorityEnum>;

/** Textos y orden de las columnas del tablero. */
export const COLUMNAS: { estado: TaskStatusValue; titulo: string }[] = [
  { estado: "todo", titulo: "Por hacer" },
  { estado: "in_progress", titulo: "En progreso" },
  { estado: "done", titulo: "Hecho" },
];

export const ETIQUETAS_PRIORIDAD: Record<TaskPriorityValue, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export const ESTILOS_PRIORIDAD: Record<TaskPriorityValue, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
};
