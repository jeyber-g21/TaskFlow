import { expect, test } from "@playwright/test";

import { crearEquipo, registrarse } from "./utilidades";

/**
 * El análisis con IA no se lanza de verdad en los recorridos: cada llamada
 * cuesta dinero y su texto cambia de una vez a otra. Lo que se comprueba es
 * que la ruta no se deja usar sin sesión y que, sin clave, la app lo explica
 * en vez de romperse. El cupo diario se prueba en los tests de permisos.
 */

test.describe("análisis con IA", () => {
  test("la ruta del análisis exige sesión", async ({ request }) => {
    const respuesta = await request.post(
      "/api/projects/00000000-0000-0000-0000-000000000000/analisis",
    );

    expect(respuesta.status()).toBe(401);
  });

  test("sin clave de la API, el tablero lo presenta como en desarrollo", async ({ page }) => {
    test.skip(
      Boolean(process.env.ANTHROPIC_API_KEY),
      "Con clave configurada el análisis está activo.",
    );

    await registrarse(page, "analisis");
    await crearEquipo(page, "Equipo Análisis", { conEjemplo: true });
    await page.getByRole("link", { name: "Lanzamiento de la web" }).click();

    await expect(
      page.getByRole("heading", { name: /Análisis con IA/ }),
    ).toBeVisible();
    await expect(page.getByText("En desarrollo", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Analizar tablero" }),
    ).toHaveCount(0);
  });
});
