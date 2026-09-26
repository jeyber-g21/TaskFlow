import { expect, test, type Page } from "@playwright/test";

import {
  crearProyectoYAbrir,
  registrarseConEquipo,
  rellenarTarea,
} from "./utilidades";

/**
 * El tablero es donde se pasa el tiempo en esta aplicación, así que estos
 * recorridos cubren el ciclo completo de una tarea: nace, se mueve, se edita
 * y desaparece.
 */

/** La columna con ese nombre, para no confundir tareas de columnas distintas. */
function columna(page: Page, nombre: string) {
  return page.getByRole("region", { name: nombre });
}

test.describe("tablero de tareas", () => {
  test("una tarea nace en la columna desde la que se crea", async ({ page }) => {
    await registrarseConEquipo(page, "nace", "Equipo Tablero");
    await crearProyectoYAbrir(page, "Proyecto con tablero");

    // El botón vive en el pie de "En progreso", así que la tarea debe
    // aparecer ahí y no en "Por hacer".
    await columna(page, "En progreso")
      .getByRole("button", { name: "Añadir tarea" })
      .click();
    await rellenarTarea(page, { titulo: "Tarea ya empezada" });
    await page.getByRole("button", { name: "Crear tarea" }).click();

    await expect(page.getByText("Tarea creada")).toBeVisible();
    await expect(
      columna(page, "En progreso").getByRole("heading", { name: "Tarea ya empezada" }),
    ).toBeVisible();
    await expect(
      columna(page, "Por hacer").getByRole("heading", { name: "Tarea ya empezada" }),
    ).toHaveCount(0);
  });

  test("el ciclo completo de una tarea: crear, mover, editar y borrar", async ({
    page,
  }) => {
    await registrarseConEquipo(page, "ciclo-tarea", "Equipo Ciclo");
    await crearProyectoYAbrir(page, "Proyecto ciclo");

    // --- crear ---
    await page.getByRole("button", { name: "Nueva tarea" }).click();
    await rellenarTarea(page, {
      titulo: "Definir las políticas",
      descripcion: "Con dos usuarios de prueba",
      prioridad: "Alta",
    });
    await page.getByRole("button", { name: "Crear tarea" }).click();

    await expect(page.getByText("Tarea creada")).toBeVisible();
    await expect(
      columna(page, "Por hacer").getByRole("heading", { name: "Definir las políticas" }),
    ).toBeVisible();
    await expect(page.getByText("Alta")).toBeVisible();

    // --- mover a En progreso ---
    await page
      .getByRole("button", { name: "Acciones de Definir las políticas" })
      .click();
    await page.getByRole("menuitem", { name: "Mover a En progreso" }).click();

    await expect(
      columna(page, "En progreso").getByRole("heading", { name: "Definir las políticas" }),
    ).toBeVisible();

    // --- mover a Hecho y ver el recuento ---
    await page
      .getByRole("button", { name: "Acciones de Definir las políticas" })
      .click();
    await page.getByRole("menuitem", { name: "Mover a Hecho" }).click();

    await expect(
      columna(page, "Hecho").getByRole("heading", { name: "Definir las políticas" }),
    ).toBeVisible();

    // --- editar ---
    await page
      .getByRole("button", { name: "Acciones de Definir las políticas" })
      .click();
    await page.getByRole("menuitem", { name: "Editar" }).click();
    await page.getByLabel("Título").fill("Políticas revisadas");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Tarea actualizada")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Políticas revisadas" })).toBeVisible();

    // --- borrar ---
    await page
      .getByRole("button", { name: "Acciones de Políticas revisadas" })
      .click();
    await page.getByRole("menuitem", { name: "Eliminar" }).click();
    await expect(page.getByText("¿Eliminar «Políticas revisadas»?")).toBeVisible();
    await page.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByText("Tarea eliminada")).toBeVisible();
    await expect(page.getByText("Todavía no hay tareas.")).toBeVisible();
  });

  test("la primera columna no ofrece mover hacia atrás", async ({ page }) => {
    await registrarseConEquipo(page, "extremos", "Equipo Extremos");
    await crearProyectoYAbrir(page, "Proyecto extremos");

    await page.getByRole("button", { name: "Nueva tarea" }).click();
    await rellenarTarea(page, { titulo: "Primera tarea" });
    await page.getByRole("button", { name: "Crear tarea" }).click();
    await expect(page.getByText("Tarea creada")).toBeVisible();

    await page.getByRole("button", { name: "Acciones de Primera tarea" }).click();

    // Está en "Por hacer": solo cabe avanzar.
    await expect(
      page.getByRole("menuitem", { name: "Mover a En progreso" }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Mover a Por hacer/ })).toHaveCount(
      0,
    );
  });

  test("se puede asignar un responsable y aparecen sus iniciales", async ({
    page,
  }) => {
    await registrarseConEquipo(page, "responsable", "Equipo Responsable");
    await crearProyectoYAbrir(page, "Proyecto con responsable");

    await page.getByRole("button", { name: "Nueva tarea" }).click();
    await rellenarTarea(page, { titulo: "Tarea asignada" });

    await page.getByLabel("Responsable").click();
    await page.getByRole("option", { name: "Ana Prueba" }).click();
    await page.getByRole("button", { name: "Crear tarea" }).click();

    await expect(page.getByText("Tarea creada")).toBeVisible();
    // "Ana Prueba" es el nombre con el que registra el ayudante.
    await expect(page.getByTitle("Ana Prueba")).toBeVisible();
  });

  test("sin responsable, la tarjeta lo dice", async ({ page }) => {
    await registrarseConEquipo(page, "sinasignar", "Equipo Sin Asignar");
    await crearProyectoYAbrir(page, "Proyecto huérfano");

    await page.getByRole("button", { name: "Nueva tarea" }).click();
    await rellenarTarea(page, { titulo: "Tarea huérfana" });
    await page.getByRole("button", { name: "Crear tarea" }).click();

    await expect(
      columna(page, "Por hacer").getByText("Sin asignar"),
    ).toBeVisible();
  });

  test("valida el título antes de enviar nada", async ({ page }) => {
    await registrarseConEquipo(page, "valida-tarea", "Equipo Validación Tarea");
    await crearProyectoYAbrir(page, "Proyecto validación");

    await page.getByRole("button", { name: "Nueva tarea" }).click();
    await rellenarTarea(page, { titulo: "T" });
    await page.getByRole("button", { name: "Crear tarea" }).click();

    await expect(page.getByText(/al menos 2 caracteres/)).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("el panel refleja el recuento de tareas del proyecto", async ({ page }) => {
    await registrarseConEquipo(page, "recuento", "Equipo Recuento");
    await crearProyectoYAbrir(page, "Proyecto con recuento");

    for (const titulo of ["Tarea uno", "Tarea dos"]) {
      await page.getByRole("button", { name: "Nueva tarea" }).click();
      await rellenarTarea(page, { titulo });
      await page.getByRole("button", { name: "Crear tarea" }).click();
      await expect(page.getByText("Tarea creada")).toBeVisible();
    }

    // Una de las dos se marca como hecha.
    await page.getByRole("button", { name: "Acciones de Tarea uno" }).click();
    await page.getByRole("menuitem", { name: "Mover a En progreso" }).click();
    await expect(columna(page, "En progreso").getByRole("heading", { name: "Tarea uno" })).toBeVisible();

    await page.getByRole("button", { name: "Acciones de Tarea uno" }).click();
    await page.getByRole("menuitem", { name: "Mover a Hecho" }).click();
    await expect(columna(page, "Hecho").getByRole("heading", { name: "Tarea uno" })).toBeVisible();

    await page.getByRole("link", { name: "Volver al panel" }).click();

    // En la tarjeta del proyecto: 2 creadas, 1 completada.
    await expect(page.getByText("Tareas creadas")).toBeVisible();
    await expect(page.getByText("Completadas")).toBeVisible();
    await expect(page.getByText("50%")).toBeVisible();
  });
});
