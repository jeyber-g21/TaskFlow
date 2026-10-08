import { expect, type Page } from "@playwright/test";

import { DOMINIO_PRUEBAS, PREFIJO } from "./ejecucion";

export const CONTRASENA = "contrasena-de-prueba-2026";

/**
 * El dominio marca las cuentas como desechables: la limpieza posterior borra
 * por este sufijo, así que nunca toca datos reales.
 */
export function emailDePrueba(etiqueta: string) {
  const unico = Math.random().toString(36).slice(2, 8);
  return `${PREFIJO}-${etiqueta}-${unico}@${DOMINIO_PRUEBAS}`;
}

/**
 * Registra una cuenta nueva. Termina en /bienvenida, porque quien acaba de
 * registrarse todavía no tiene equipo.
 */
export async function registrarse(
  page: Page,
  etiqueta: string,
  nombre = "Ana Prueba",
) {
  const email = emailDePrueba(etiqueta);

  await page.goto("/register");
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(CONTRASENA);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  // Supabase limita cuántas cuentas se pueden crear por hora desde una misma
  // dirección. La suite crea unas cincuenta seguidas, así que al toparse con
  // el límite conviene decirlo: el error por defecto sería un tiempo de
  // espera agotado, que no explica nada.
  const avisoDeLimite = page.getByText(/Demasiados intentos/);
  if (await avisoDeLimite.isVisible().catch(() => false)) {
    throw new Error(
      "Supabase ha cortado el registro por exceso de intentos. Sube el límite " +
        "en Authentication → Rate Limits o espacia las ejecuciones.",
    );
  }

  await expect(page).toHaveURL(/\/bienvenida$/);

  return email;
}

/**
 * Crea el equipo y deja la sesión en el panel.
 *
 * Sin el proyecto de ejemplo salvo que se pida: cada test cuenta y busca sus
 * propios proyectos y tareas, y siete tareas de muestra se meterían en medio.
 */
export async function crearEquipo(
  page: Page,
  nombre: string,
  { conEjemplo = false } = {},
) {
  await page.getByLabel("Nombre del equipo").fill(nombre);
  await page
    .getByLabel("Añadir un proyecto de ejemplo")
    .setChecked(conEjemplo);
  await page.getByRole("button", { name: "Crear equipo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Registro y equipo de una sola vez, para los tests que empiezan ya dentro. */
export async function registrarseConEquipo(
  page: Page,
  etiqueta: string,
  equipo = "Equipo de Prueba",
) {
  const email = await registrarse(page, etiqueta);
  await crearEquipo(page, equipo);
  return email;
}

export async function iniciarSesion(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(CONTRASENA);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function cerrarSesion(page: Page) {
  await page.getByRole("button", { name: "Salir" }).click();
  // Hay que esperar a que termine de navegar: si no, su redirección llega
  // después de la siguiente orden y pisa la URL que se va a comprobar.
  await expect(page).toHaveURL(/\/login$/);
}

/** Crea un proyecto desde el panel y entra en su tablero. */
export async function crearProyectoYAbrir(page: Page, nombre: string) {
  await page.getByRole("button", { name: "Nuevo proyecto" }).first().click();
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByText("Proyecto creado")).toBeVisible();

  await page.getByRole("link", { name: nombre }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
}

/** Rellena el diálogo de tarea que ya esté abierto. */
export async function rellenarTarea(
  page: Page,
  datos: { titulo: string; descripcion?: string; prioridad?: string },
) {
  // Se busca dentro del diálogo: el tablero tiene detrás sus propios filtros,
  // y sin acotar, "Prioridad" encontraría dos controles distintos.
  const dialogo = page.getByRole("dialog");

  await dialogo.getByLabel("Título").fill(datos.titulo);

  if (datos.descripcion) {
    await dialogo.getByLabel(/Descripción/).fill(datos.descripcion);
  }

  if (datos.prioridad) {
    await dialogo.getByLabel("Prioridad").click();
    await page.getByRole("option", { name: datos.prioridad }).click();
  }
}
