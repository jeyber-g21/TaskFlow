import { expect, type Page } from "@playwright/test";

export const CONTRASENA = "contrasena-de-prueba-2026";

/**
 * El dominio marca las cuentas como desechables: la limpieza posterior borra
 * por este sufijo, así que nunca toca datos reales.
 */
export function emailDePrueba(etiqueta: string) {
  const unico = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e-${etiqueta}-${unico}@taskflow-pruebas.dev`;
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
  await expect(page).toHaveURL(/\/bienvenida$/);

  return email;
}

/** Crea el equipo y deja la sesión en el panel. */
export async function crearEquipo(page: Page, nombre: string) {
  await page.getByLabel("Nombre del equipo").fill(nombre);
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
