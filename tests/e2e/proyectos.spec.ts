import { expect, test } from "@playwright/test";

import {
  cerrarSesion,
  crearEquipo,
  registrarse,
  registrarseConEquipo,
} from "./utilidades";

/**
 * El recorrido de alguien que entra por primera vez: se registra, crea su
 * equipo y monta su primer proyecto.
 */

test.describe("primer acceso", () => {
  test("quien se registra aterriza en la creación del equipo", async ({ page }) => {
    await registrarse(page, "alta");

    // Sin equipo no hay panel que enseñar.
    await expect(
      page.getByText(/Todo el trabajo vive dentro de un equipo/),
    ).toBeVisible();
  });

  test("crea su equipo y llega al panel vacío", async ({ page }) => {
    await registrarseConEquipo(page, "equipo", "Equipo de Ana");

    await expect(page.getByRole("heading", { name: "Equipo de Ana" })).toBeVisible();
    await expect(page.getByText("Crea tu primer proyecto")).toBeVisible();
    // Quien crea el equipo es su administrador.
    await expect(page.getByText("Admin")).toBeVisible();
  });

  test("el proyecto de ejemplo llega con sus tareas repartidas", async ({ page }) => {
    await registrarse(page, "ejemplo");
    await crearEquipo(page, "Equipo Ejemplo", { conEjemplo: true });

    await page.getByRole("link", { name: "Lanzamiento de la web" }).click();
    await expect(
      page.getByRole("heading", { name: "Lanzamiento de la web" }),
    ).toBeVisible();
    await expect(
      page.getByText("Escribir los textos de la página de inicio"),
    ).toBeVisible();
    await expect(page.getByText("Reservar el dominio")).toBeVisible();
  });

  test("con equipo ya creado, /bienvenida devuelve al panel", async ({ page }) => {
    await registrarseConEquipo(page, "vuelta", "Equipo Vuelta");

    await page.goto("/bienvenida");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("proyectos", () => {
  test("crear, ver, editar y eliminar un proyecto", async ({ page }) => {
    await registrarseConEquipo(page, "crud", "Equipo CRUD");

    // --- crear ---
    await page.getByRole("button", { name: "Nuevo proyecto" }).first().click();
    await page.getByLabel("Nombre").fill("Rediseño del onboarding");
    await page.getByLabel(/Descripción/).fill("Reducir los pasos del alta");
    await page.getByRole("button", { name: "Crear proyecto" }).click();

    await expect(page.getByText("Proyecto creado")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Rediseño del onboarding" }),
    ).toBeVisible();
    await expect(page.getByText("Sin tareas todavía")).toBeVisible();

    // --- abrir ---
    await page.getByRole("link", { name: "Rediseño del onboarding" }).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
    await expect(
      page.getByRole("heading", { name: "Rediseño del onboarding" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Volver al panel" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // --- editar ---
    await page.getByRole("button", { name: "Acciones del proyecto" }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();
    await page.getByLabel("Nombre").fill("Onboarding v2");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Proyecto actualizado")).toBeVisible();
    await expect(page.getByRole("link", { name: "Onboarding v2" })).toBeVisible();

    // --- eliminar ---
    await page.getByRole("button", { name: "Acciones del proyecto" }).click();
    await page.getByRole("menuitem", { name: "Eliminar" }).click();
    await expect(page.getByText("¿Eliminar «Onboarding v2»?")).toBeVisible();
    await page.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByText("Proyecto eliminado")).toBeVisible();
    await expect(page.getByText("Crea tu primer proyecto")).toBeVisible();
  });

  test("valida el formulario antes de enviarlo", async ({ page }) => {
    await registrarseConEquipo(page, "valida", "Equipo Validación");

    await page.getByRole("button", { name: "Nuevo proyecto" }).first().click();
    await page.getByLabel("Nombre").fill("P");
    await page.getByRole("button", { name: "Crear proyecto" }).click();

    await expect(page.getByText(/al menos 2 caracteres/)).toBeVisible();
    // El diálogo sigue abierto: no se ha enviado nada.
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("un proyecto de otro equipo no existe para ti", async ({ page }) => {
    await registrarseConEquipo(page, "ajeno", "Equipo Ajeno");

    await page.getByRole("button", { name: "Nuevo proyecto" }).first().click();
    await page.getByLabel("Nombre").fill("Proyecto privado");
    await page.getByRole("button", { name: "Crear proyecto" }).click();
    await expect(page.getByText("Proyecto creado")).toBeVisible();

    await page.getByRole("link", { name: "Proyecto privado" }).click();
    // Hay que esperar a que el clic navegue: leer page.url() antes devuelve
    // todavía la del panel, y el test comprobaría otra cosa sin enterarse.
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
    const urlAjena = page.url();

    // Otra persona, con la URL exacta del proyecto.
    await cerrarSesion(page);
    await registrarseConEquipo(page, "intruso", "Equipo Intruso");

    await page.goto(urlAjena);
    // La base de datos no devuelve la fila, así que la página no existe. No
    // se confirma que ese identificador sea válido.
    await expect(
      page.getByRole("heading", { name: "Aquí no hay nada" }),
    ).toBeVisible();
  });
});
