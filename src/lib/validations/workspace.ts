import { z } from "zod";

/**
 * Igual que en autenticación: el mismo esquema valida en el navegador, para
 * responder al momento, y en el servidor, que es donde de verdad protege.
 */

export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "El nombre del equipo necesita al menos 2 caracteres." })
    .max(60, { message: "El nombre no puede pasar de 60 caracteres." }),
  // Un panel vacío no enseña nada, así que viene marcado por defecto.
  conEjemplo: z.boolean().default(true),
});

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "El nombre del proyecto necesita al menos 2 caracteres." })
    .max(80, { message: "El nombre no puede pasar de 80 caracteres." }),
  description: z
    .string()
    .trim()
    .max(280, { message: "La descripción no puede pasar de 280 caracteres." })
    // Un campo vacío llega como "" desde el formulario; en la base de datos
    // eso debe ser NULL, no una cadena vacía.
    .transform((valor) => (valor === "" ? null : valor))
    .nullable(),
});

export type TeamInput = z.infer<typeof teamSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
