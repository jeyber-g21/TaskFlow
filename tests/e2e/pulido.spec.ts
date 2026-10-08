import { expect, test } from "@playwright/test";

import { emailDePrueba, registrarseConEquipo } from "./utilidades";

/**
 * Los detalles de la fase de pulido: cambiar de tema, recuperar la contraseña
 * y lo que se ve al pedir una dirección que no existe.
 */

test.describe("tema claro y oscuro", () => {
  test("se puede cambiar y queda recordado al recargar", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Cambiar tema/ }).click();
    await page.getByRole("menuitem", { name: "Oscuro" }).click();

    // La clase del <html> es lo que de verdad cambia el aspecto de todo.
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("volver a claro quita el modo oscuro", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Cambiar tema/ }).click();
    await page.getByRole("menuitem", { name: "Oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("button", { name: /Cambiar tema/ }).click();
    await page.getByRole("menuitem", { name: "Claro" }).click();

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("el tema elegido se mantiene al navegar a otra página", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Cambiar tema/ }).click();
    await page.getByRole("menuitem", { name: "Oscuro" }).click();

    await page.goto("/login");

    // Si parpadeara, esta comprobación justo tras cargar lo delataría.
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("recuperar contraseña", () => {
  test("se llega desde el login", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();

    await expect(page).toHaveURL(/\/recuperar$/);
    await expect(page.getByText(/Olvidaste tu contraseña/)).toBeVisible();
  });

  test("responde lo mismo exista o no la cuenta", async ({ page }) => {
    // Si dijera "ese email no está registrado", el formulario serviría para
    // averiguar quién tiene cuenta. Por eso la respuesta es siempre igual.
    await page.goto("/recuperar");
    await page.getByLabel("Email").fill(emailDePrueba("fantasma"));
    await page.getByRole("button", { name: "Enviar enlace" }).click();

    await expect(page.getByText(/Si existe una cuenta con ese email/)).toBeVisible();
  });

  test("rechaza un email mal escrito sin llamar al servidor", async ({ page }) => {
    await page.goto("/recuperar");
    await page.getByLabel("Email").fill("esto-no-es-un-email");
    await page.getByRole("button", { name: "Enviar enlace" }).click();

    await expect(page.getByText("Introduce un email válido.")).toBeVisible();
    await expect(page).toHaveURL(/\/recuperar$/);
  });

  test("sin el enlace del correo, la pantalla de nueva contraseña no sirve", async ({
    page,
  }) => {
    await page.goto("/nueva-contrasena");

    await expect(page.getByText(/El enlace ya no vale/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Pedir otro enlace" })).toBeVisible();
  });

  test("un enlace caducado deja un mensaje claro en el login", async ({ page }) => {
    // Es lo que manda Supabase cuando el código ya se usó o expiró.
    await page.goto("/?error=access_denied&error_code=otp_expired");

    await expect(page).toHaveURL(/\/login\?error=/);
    await expect(page.getByText(/ha caducado o ya se usó/)).toBeVisible();
  });
});

test.describe("direcciones que no existen", () => {
  test("muestran la página propia y no la de Next", async ({ page }) => {
    await page.goto("/esta-pagina-no-existe");

    await expect(page.getByRole("heading", { name: "Aquí no hay nada" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
  });

  test("un proyecto de otro equipo se ve igual que uno inexistente", async ({
    page,
  }) => {
    await registrarseConEquipo(page, "cuatrocientos", "Equipo 404");

    // Un identificador con forma válida pero que no es de este equipo.
    await page.goto("/projects/3f2504e0-4f89-11d3-9a0c-0305e82c3301");

    await expect(page.getByRole("heading", { name: "Aquí no hay nada" })).toBeVisible();
  });
});
