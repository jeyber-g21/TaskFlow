import { expect, test } from "@playwright/test";

/**
 * El recorrido que hace cualquiera que entre en la demo. Si esto pasa, la
 * aplicación funciona de verdad: no hay dobles de prueba ni peticiones
 * simuladas, se registra contra Supabase y navega como una persona.
 */

const CONTRASENA = "contrasena-de-prueba-2026";

function emailDePrueba(etiqueta: string) {
  const unico = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e-${etiqueta}-${unico}@taskflow-pruebas.dev`;
}

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
  test("una persona nueva se registra y entra a su panel", async ({ page }) => {
    const email = emailDePrueba("alta");

    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Persona de Prueba");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hola, Persona");
  });

  test("el recorrido completo: salir, volver a entrar y cerrar sesión", async ({ page }) => {
    const email = emailDePrueba("ciclo");

    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Ida Vuelta");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("validación de formularios", () => {
  test("avisa de los campos mal rellenados sin llamar al servidor", async ({ page }) => {
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

  test("muestra un mensaje claro si las credenciales son incorrectas", async ({ page }) => {
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

    for (const intento of [1, 2]) {
      await page.goto("/register");
      await page.getByLabel("Nombre").fill("Persona Repetida");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Contraseña").fill(CONTRASENA);
      await page.getByRole("button", { name: "Crear cuenta" }).click();

      if (intento === 1) {
        await expect(page).toHaveURL(/\/dashboard$/);
        await page.getByRole("button", { name: "Salir" }).click();
        await expect(page).toHaveURL(/\/login$/);
      }
    }

    await expect(page.getByText(/Ya existe una cuenta/)).toBeVisible();
  });
});

test.describe("rutas protegidas", () => {
  test("sin sesión, el panel redirige al login y recuerda el destino", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test("tras iniciar sesión vuelve a donde quería ir", async ({ page }) => {
    const email = emailDePrueba("destino");

    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Vuelta Al Destino");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: "Salir" }).click();
    // Hay que esperar a que el logout termine de navegar: si no, su redirección
    // llega después del goto siguiente y pisa la URL que estamos comprobando.
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/next=%2Fdashboard/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("con sesión abierta, /login devuelve al panel", async ({ page }) => {
    const email = emailDePrueba("yaentro");

    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Ya Dentro");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
