import { defineConfig } from "vitest/config";

/**
 * Configuración aparte para los tests que hablan con Supabase de verdad.
 * Son lentos y necesitan credenciales, así que no deben correr en cada
 * guardado ni bloquear a quien clone el repo sin configurar nada.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    // Crean y borran usuarios reales: si corrieran en paralelo se pisarían.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
