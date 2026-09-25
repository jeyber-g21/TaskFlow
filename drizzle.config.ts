import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Carga .env.local con las mismas reglas que usa Next, sin añadir dependencias.
loadEnvConfig(process.cwd());

/**
 * Drizzle define el esquema y genera las migraciones; las consultas de la app
 * van por el cliente de Supabase, que sí respeta las políticas RLS.
 *
 * Las migraciones usan la conexión en modo sesión (puerto 5432): el pooler en
 * modo transacción no admite bien las sentencias DDL.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? "",
  },
  // Supabase gestiona el resto de esquemas; que Drizzle no intente tocarlos.
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
