import { defineConfig, devices } from "@playwright/test";

import { cargarEntornoLocal } from "./tests/integration/entorno";

cargarEntornoLocal();

// Un puerto poco común a propósito: el 3000 y el 3100 los ocupa cualquier otro
// proyecto que tengas abierto, y entonces los tests acaban hablando con otra
// aplicación y fallando por motivos que no tienen nada que ver con este código.
const PUERTO = 3177;
const BASE_URL = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Registran usuarios reales: en paralelo se estorbarían entre sí.
  workers: 1,
  fullyParallel: false,
  // En CI, un test que pasa al segundo intento suele esconder una carrera.
  // Localmente un reintento evita perder el tiempo con fallos de red.
  retries: process.env.CI ? 0 : 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  // En desarrollo, Next compila cada ruta la primera vez que se visita, y eso
  // se come de sobra los 5 segundos que Playwright da por defecto.
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-ES",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // En CI se prueba el build de producción, que es lo que ve la gente.
    // En local se usa el servidor de desarrollo para no esperar a compilar.
    command: process.env.CI
      ? `npm run build && npm run start -- --port ${PUERTO}`
      : `npm run dev -- --port ${PUERTO}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },

  globalSetup: "./tests/e2e/preparacion.ts",
  globalTeardown: "./tests/e2e/limpieza.ts",
});
