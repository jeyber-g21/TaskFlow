import { z } from "zod";

/**
 * Valida las variables de entorno al arrancar, en lugar de descubrir que
 * falta una cuando ya estás depurando un error raro en producción.
 *
 * Las `NEXT_PUBLIC_*` se leen con su nombre literal a propósito: Next las
 * sustituye en tiempo de compilación y no funcionaría un acceso dinámico
 * del tipo `process.env[nombre]`.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    message: "NEXT_PUBLIC_SUPABASE_URL debe ser la URL del proyecto de Supabase.",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase → Project Settings → API).",
  }),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const detalle = parsed.error.issues.map((issue) => `  · ${issue.message}`).join("\n");
  throw new Error(
    `Variables de entorno inválidas o ausentes:\n${detalle}\n\nCopia .env.example como .env.local y rellena los valores.`,
  );
}

export const env = parsed.data;
