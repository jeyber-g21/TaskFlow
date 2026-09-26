import { expect, test } from "@playwright/test";

import {
  CONTRASENA,
  cerrarSesion,
  crearEquipo,
  emailDePrueba,
  iniciarSesion,
  registrarse,
  registrarseConEquipo,
} from "./utilidades";

/**
 * El recorrido que hace cualquiera que entre en la demo. Si esto pasa, la
 * aplicación funciona de verdad: no hay dobles de prueba ni peticiones
 * simuladas, se registra contra Supabase y navega como una persona.
 */

test.describe("landing", () => {
  test("presenta el producto y lleva al registro", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "El trabajo de tu equipo",
    );

    await page.getByRole("link", { name: "Crear cuenta gratis" }).click();
    await expect(page).toHaveURL(/\/register$/);
  });
});

test.describe("registro e inicio de sesión", () => {
  test("quien se registra pasa a crear su equipo", async ({ page }) => {
    await registrarse(page, "alta");

    await expect(page.getByRole("button", { name: "Crear equipo" })).toBeVisible();
  });

  test("el recorrido completo: registrarse, salir y volver a entrar", async ({
    page,
  }) => {
    const email = await registrarseConEquipo(page, "ciclo", "Equipo Ciclo");

    await cerrarSesion(page);

    await iniciarSesion(page, email);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Equipo Ciclo" })).toBeVisible();
  });
});

test.describe("validación de formularios", () => {
  test("avisa de los campos mal rellenados sin llamar al servidor", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByLabel("Nombre").fill("A");
    await page.getByLabel("Email").fill("esto-no-es-un-email");
    await page.getByLabel("Contraseña").fill("corta");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page.getByText("Introduce un email válido.")).toBeVisible();
    await expect(page.getByText(/al menos 8 caracteres/)).toBeVisible();
    // Sigue en la misma página: no se envió nada.
    await expect(page).toHaveURL(/\/register$/);
  });

  test("muestra un mensaje claro si las credenciales son incorrectas", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("no-existe@taskflow-pruebas.dev");
    await page.getByLabel("Contraseña").fill("contrasena-equivocada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(
      page.getByText("El email o la contraseña no son correctos."),
    ).toBeVisible();
  });

  test("no deja registrar dos veces el mismo email", async ({ page }) => {
    const email = emailDePrueba("duplicado");

    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Persona Repetida");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/bienvenida$/);

    await crearEquipo(page, "Equipo Repetido");
    await cerrarSesion(page);

    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Persona Repetida");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page.getByText(/Ya existe una cuenta/)).toBeVisible();
  });
});

test.describe("rutas protegidas", () => {
  test("sin sesión, el panel redirige al login y recuerda el destino", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test("tras iniciar sesión vuelve a donde quería ir", async ({ page }) => {
    const email = await registrarseConEquipo(page, "destino", "Equipo Destino");
    await cerrarSesion(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/next=%2Fdashboard/);

    await iniciarSesion(page, email);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("con sesión abierta, /login devuelve al panel", async ({ page }) => {
    await registrarseConEquipo(page, "yaentro", "Equipo Ya Dentro");

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("sin equipo, el panel lleva a crear uno", async ({ page }) => {
    await registrarse(page, "sinequipo");

    // Aunque se pida el panel directamente, no hay nada que enseñar todavía.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/bienvenida$/);
  });
});
