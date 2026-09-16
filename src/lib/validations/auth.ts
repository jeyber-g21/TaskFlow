import { z } from "zod";

/**
 * Un único esquema por formulario, usado en los dos lados:
 * en el cliente para avisar al momento, y en el servidor porque es la
 * validación que de verdad protege (el cliente siempre es manipulable).
 */

export const loginSchema = z.object({
  email: z.email({ message: "Introduce un email válido." }),
  password: z.string().min(1, { message: "Escribe tu contraseña." }),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Escribe tu nombre (mínimo 2 caracteres)." })
    .max(80, { message: "El nombre no puede pasar de 80 caracteres." }),
  email: z.email({ message: "Introduce un email válido." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .max(72, { message: "La contraseña no puede pasar de 72 caracteres." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
