import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite ya resuelve los alias de tsconfig ("@/..."), sin plugin extra.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    // Los tests de integración van aparte: necesitan credenciales y tocan la
    // base de datos real, así que no deben correr en cada guardado.
    include: ["tests/unit/**/*.test.ts"],
  },
});
