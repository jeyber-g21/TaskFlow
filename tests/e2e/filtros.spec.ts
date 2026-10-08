import { expect, test, type Page } from "@playwright/test";

import {
  crearProyectoYAbrir,
  registrarseConEquipo,
  rellenarTarea,
} from "./utilidades";

/**
 * Filtrar el tablero.
 *
 * Cada recorrido registra una cuenta real, así que se agrupan varias
 * comprobaciones por test en lugar de hacer uno por cada caso: la suite crea
 * ya bastantes usuarios y Supabase limita cuántos se pueden crear por hora.
 */

/** Crea una tarea desde el botón principal del tablero. */
async function crearTarea(
  page: Page,
  datos: { titulo: string; descripcion?: string; prioridad?: string },
) {
  await page.getByRole("button", { name: "Nueva tarea" }).click();
  await rellenarTarea(page, datos);
  await page.getByRole("button", { name: "Crear tarea" }).click();

  // Se espera a que la tarea esté en el tablero y no al aviso de "Tarea
  // creada": al crear varias seguidas los avisos se solapan y deja de haber
  // uno solo al que mirar.
  await expect(page.getByRole("heading", { name: datos.titulo })).toBeVisible();
}

/** Monta un proyecto con tres tareas de prioridades distintas. */
async function prepararTablero(page: Page, etiqueta: string, equipo: string) {
  await registrarseConEquipo(page, etiqueta, equipo);
  await crearProyectoYAbrir(page, "Proyecto con filtros");

  await crearTarea(page, {
    titulo: "Rediseñar el onboarding",
    descripcion: "Reducir los pasos del alta",
    prioridad: "Alta",
  });
  await crearTarea(page, { titulo: "Revisar textos legales", prioridad: "Baja" });
  await crearTarea(page, { titulo: "Migrar la base de datos", prioridad: "Alta" });
}

test.describe("filtros del tablero", () => {
  test("buscar por texto deja solo lo que coincide", async ({ page }) => {
    await prepararTablero(page, "busca", "Equipo Búsqueda");

    await page.getByLabel("Buscar tareas").fill("onboarding");
    await expect(page).toHaveURL(/q=onboarding/);

    await expect(
      page.getByRole("heading", { name: "Rediseñar el onboarding" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Revisar textos legales" }),
    ).toHaveCount(0);

    // También busca dentro de la descripción, no solo en el título.
    await page.getByLabel("Buscar tareas").fill("pasos del alta");
    await expect(
      page.getByRole("heading", { name: "Rediseñar el onboarding" }),
    ).toBeVisible();

    // Y al vaciarlo vuelven todas.
    await page.getByRole("button", { name: "Quitar filtros" }).click();
    await expect(
      page.getByRole("heading", { name: "Revisar textos legales" }),
    ).toBeVisible();
  });

  test("filtrar por prioridad y por responsable", async ({ page }) => {
    await prepararTablero(page, "prioridad", "Equipo Prioridad");

    await page.getByLabel("Filtrar por prioridad").click();
    await page.getByRole("option", { name: "Alta" }).click();

    await expect(page).toHaveURL(/prioridad=high/);
    await expect(
      page.getByRole("heading", { name: "Rediseñar el onboarding" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Migrar la base de datos" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Revisar textos legales" }),
    ).toHaveCount(0);

    // Ninguna tarea tiene responsable, así que "sin asignar" las devuelve
    // todas y elegir a una persona no devuelve ninguna.
    await page.getByRole("button", { name: "Quitar filtros" }).click();

    await page.getByLabel("Filtrar por responsable").click();
    await page.getByRole("option", { name: "Ana Prueba" }).click();

    await expect(page.getByText(/Ninguna tarea coincide con los filtros/)).toBeVisible();
  });

  test("los filtros viajan en la URL y se pueden compartir", async ({ page }) => {
    await prepararTablero(page, "comparte", "Equipo Compartir");

    await page.getByLabel("Filtrar por prioridad").click();
    await page.getByRole("option", { name: "Baja" }).click();
    await expect(page).toHaveURL(/prioridad=low/);

    const enlaceFiltrado = page.url();

    // Abrir esa misma dirección reproduce el tablero tal cual: es lo que
    // permite pasarle a alguien "mira esto" con un enlace.
    await page.goto(enlaceFiltrado);

    await expect(
      page.getByRole("heading", { name: "Revisar textos legales" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Migrar la base de datos" }),
    ).toHaveCount(0);
  });

  test("una URL con un filtro inventado no rompe la página", async ({ page }) => {
    await prepararTablero(page, "manipula", "Equipo Manipulado");

    const base = page.url();
    await page.goto(`${base}?prioridad=urgentisima&responsable=yo-mismo`);

    // Se ignora lo que no tiene sentido y el tablero sigue en pie.
    await expect(
      page.getByRole("heading", { name: "Proyecto con filtros" }),
    ).toBeVisible();
  });
});
