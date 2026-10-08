import { expect, test, type Page } from "@playwright/test";

import { CONTRASENA, emailDePrueba, registrarseConEquipo } from "./utilidades";

/**
 * Unirse implica una redirección al panel, y la primera vez que se visita una
 * ruta el servidor de desarrollo la compila. Ese margen extra evita un fallo
 * intermitente que no tiene nada que ver con la aplicación.
 */
const ESPERA_PRIMERA_CARGA = { timeout: 30_000 };

/**
 * Los roles solo se pueden probar de verdad con dos personas a la vez, así que
 * estos recorridos abren dos sesiones de navegador en paralelo: una para quien
 * administra y otra para quien es invitado.
 */

/** Genera una invitación desde los ajustes y devuelve su enlace. */
async function invitarA(page: Page, email: string, rol = "Miembro") {
  await page.goto("/settings");

  await page.getByLabel("Email de quien invitas").fill(email);
  if (rol !== "Miembro") {
    await page.getByLabel("Rol").click();
    await page.getByRole("option", { name: rol }).click();
  }
  await page.getByRole("button", { name: "Generar invitación" }).click();
  await expect(page.getByText("Invitación creada")).toBeVisible();

  const enlace = await page.locator("code").first().innerText();
  return enlace.trim();
}

/** Registra una cuenta sin crear equipo: se queda en /bienvenida. */
async function registrarseSinEquipo(page: Page, email: string, nombre: string) {
  await page.goto("/register");
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(CONTRASENA);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/bienvenida$/);
}

test.describe("invitaciones", () => {
  test("el enlace mete a la persona en el equipo", async ({ browser }) => {
    const sesionAdmin = await browser.newContext();
    const sesionInvitado = await browser.newContext();
    const admin = await sesionAdmin.newPage();
    const invitado = await sesionInvitado.newPage();

    try {
      await registrarseConEquipo(admin, "jefa", "Equipo Invitaciones");

      const emailInvitado = emailDePrueba("invitado");
      const enlace = await invitarA(admin, emailInvitado);

      // La persona invitada llega con el enlace, sin haber visto el equipo.
      await registrarseSinEquipo(invitado, emailInvitado, "Persona Invitada");
      await invitado.goto(enlace);

      await expect(
        invitado.getByText(/Te han invitado a Equipo Invitaciones/),
      ).toBeVisible();
      await invitado.getByRole("button", { name: /Unirme a/ }).click();

      await expect(invitado).toHaveURL(/\/dashboard$/, ESPERA_PRIMERA_CARGA);
      await expect(
        invitado.getByRole("heading", { name: "Equipo Invitaciones" }),
      ).toBeVisible();
    } finally {
      await sesionAdmin.close();
      await sesionInvitado.close();
    }
  });

  test("la invitación aparece sola al entrar con el email invitado", async ({
    browser,
  }) => {
    const sesionAdmin = await browser.newContext();
    const sesionInvitado = await browser.newContext();
    const admin = await sesionAdmin.newPage();
    const invitado = await sesionInvitado.newPage();

    try {
      await registrarseConEquipo(admin, "jefa2", "Equipo Sin Enlace");

      const emailInvitado = emailDePrueba("porcorreo");
      await invitarA(admin, emailInvitado);

      // Sin usar el enlace: solo se registra con el email al que se invitó.
      await registrarseSinEquipo(invitado, emailInvitado, "Sin Enlace");

      await expect(
        invitado.getByText(/Te han invitado a Equipo Sin Enlace/),
      ).toBeVisible();
      await invitado.getByRole("button", { name: /Unirme a/ }).click();

      await expect(invitado).toHaveURL(/\/dashboard$/, ESPERA_PRIMERA_CARGA);
    } finally {
      await sesionAdmin.close();
      await sesionInvitado.close();
    }
  });

  test("un enlace ya usado no sirve otra vez", async ({ browser }) => {
    const sesionAdmin = await browser.newContext();
    const sesionPrimero = await browser.newContext();
    const sesionSegundo = await browser.newContext();
    const admin = await sesionAdmin.newPage();
    const primero = await sesionPrimero.newPage();
    const segundo = await sesionSegundo.newPage();

    try {
      await registrarseConEquipo(admin, "jefa3", "Equipo Un Solo Uso");
      const enlace = await invitarA(admin, emailDePrueba("primero"));

      await registrarseSinEquipo(primero, emailDePrueba("uno"), "Primera Persona");
      await primero.goto(enlace);
      await primero.getByRole("button", { name: /Unirme a/ }).click();
      await expect(primero).toHaveURL(/\/dashboard$/, ESPERA_PRIMERA_CARGA);

      // Alguien más con el mismo enlace: ya no vale.
      await registrarseSinEquipo(segundo, emailDePrueba("dos"), "Segunda Persona");
      await segundo.goto(enlace);

      await expect(segundo.getByText(/ya se usó/)).toBeVisible();
    } finally {
      await sesionAdmin.close();
      await sesionPrimero.close();
      await sesionSegundo.close();
    }
  });

  test("un enlace inventado no lleva a ningún equipo", async ({ page }) => {
    await registrarseConEquipo(page, "curiosa", "Equipo Curiosa");

    await page.goto("/unirse/este-codigo-no-existe");

    await expect(page.getByText(/no existe/)).toBeVisible();
  });

  test("el administrador puede revocar una invitación", async ({ page }) => {
    await registrarseConEquipo(page, "revoca", "Equipo Revocar");

    const email = emailDePrueba("revocado");
    await invitarA(page, email);

    await expect(page.getByText("Invitaciones pendientes")).toBeVisible();
    await page
      .getByRole("button", { name: `Revocar invitación de ${email}` })
      .click();

    await expect(page.getByText("Invitación revocada")).toBeVisible();
    await expect(page.getByText("Invitaciones pendientes")).toHaveCount(0);
  });
});

test.describe("roles", () => {
  test("un miembro no puede gestionar el equipo", async ({ browser }) => {
    const sesionAdmin = await browser.newContext();
    const sesionMiembro = await browser.newContext();
    const admin = await sesionAdmin.newPage();
    const miembro = await sesionMiembro.newPage();

    try {
      await registrarseConEquipo(admin, "jefa4", "Equipo Permisos");

      const email = emailDePrueba("colaborador");
      const enlace = await invitarA(admin, email);

      await registrarseSinEquipo(miembro, email, "Colaborador Normal");
      await miembro.goto(enlace);
      await miembro.getByRole("button", { name: /Unirme a/ }).click();
      await expect(miembro).toHaveURL(/\/dashboard$/, ESPERA_PRIMERA_CARGA);

      // En los ajustes ve el equipo, pero sin herramientas de gestión.
      await miembro.goto("/settings");
      await expect(
        miembro.getByText(/Solo los administradores pueden invitar/),
      ).toBeVisible();
      await expect(
        miembro.getByLabel("Email de quien invitas"),
      ).toHaveCount(0);
      await expect(
        miembro.getByRole("button", { name: /Acciones sobre/ }),
      ).toHaveCount(0);
    } finally {
      await sesionAdmin.close();
      await sesionMiembro.close();
    }
  });

  test("el administrador cambia el rol de un miembro y lo expulsa", async ({
    browser,
  }) => {
    const sesionAdmin = await browser.newContext();
    const sesionMiembro = await browser.newContext();
    const admin = await sesionAdmin.newPage();
    const miembro = await sesionMiembro.newPage();

    try {
      await registrarseConEquipo(admin, "jefa5", "Equipo Gestión");

      const email = emailDePrueba("gestionado");
      const enlace = await invitarA(admin, email);

      await registrarseSinEquipo(miembro, email, "Persona Gestionada");
      await miembro.goto(enlace);
      await miembro.getByRole("button", { name: /Unirme a/ }).click();
      await expect(miembro).toHaveURL(/\/dashboard$/, ESPERA_PRIMERA_CARGA);

      // --- ascender ---
      await admin.goto("/settings");
      await admin.getByLabel("Rol de Persona Gestionada").click();
      await admin.getByRole("option", { name: "Administrador" }).click();
      await expect(admin.getByText("Rol actualizado")).toBeVisible();

      // Con el ascenso, ya puede gestionar el equipo.
      await miembro.goto("/settings");
      await expect(miembro.getByLabel("Email de quien invitas")).toBeVisible();

      // --- expulsar ---
      await admin.getByRole("button", { name: /Acciones sobre Persona Gestionada/ }).click();
      await admin.getByRole("menuitem", { name: "Sacar del equipo" }).click();
      await expect(
        admin.getByText("¿Sacar a Persona Gestionada del equipo?"),
      ).toBeVisible();
      await admin.getByRole("button", { name: "Sacar del equipo" }).click();

      await expect(admin.getByText(/ya no está en el equipo/)).toBeVisible();

      // Quien queda fuera vuelve a no tener equipo.
      await miembro.goto("/dashboard");
      await expect(miembro).toHaveURL(/\/bienvenida$/);
    } finally {
      await sesionAdmin.close();
      await sesionMiembro.close();
    }
  });

  test("el único administrador no puede dejar de serlo", async ({ browser }) => {
    const sesionAdmin = await browser.newContext();
    const sesionMiembro = await browser.newContext();
    const admin = await sesionAdmin.newPage();
    const miembro = await sesionMiembro.newPage();

    try {
      await registrarseConEquipo(admin, "jefa6", "Equipo Último Admin");

      const email = emailDePrueba("segundo");
      const enlace = await invitarA(admin, email);
      await registrarseSinEquipo(miembro, email, "Otra Persona");
      await miembro.goto(enlace);
      await miembro.getByRole("button", { name: /Unirme a/ }).click();
      // Sin esperar aquí, el admin puede abrir la página antes de que el
      // segundo miembro exista, y entonces no hay ningún rol que contar.
      await expect(miembro).toHaveURL(/\/dashboard$/, ESPERA_PRIMERA_CARGA);

      await admin.goto("/settings");
      // El aviso está mientras solo haya un administrador.
      await expect(admin.getByText(/Eres el único administrador/)).toBeVisible();
      // Y no hay forma de cambiarse el rol a uno mismo.
      await expect(admin.getByLabel(/^Rol de /)).toHaveCount(1);
    } finally {
      await sesionAdmin.close();
      await sesionMiembro.close();
    }
  });

  test("hay que iniciar sesión para aceptar una invitación", async ({ page }) => {
    await page.goto("/unirse/cualquier-codigo");

    await expect(page).toHaveURL(/\/login\?next=%2Funirse%2Fcualquier-codigo$/);
  });
});

test.describe("equipo recién creado", () => {
  test("quien lo crea es su administrador y está solo", async ({ page }) => {
    await registrarseConEquipo(page, "fundadora", "Equipo Fundadora");

    await page.goto("/settings");

    await expect(page.getByText("Estás tú solo en el equipo.")).toBeVisible();
    await expect(page.getByLabel("Email de quien invitas")).toBeVisible();
  });

  test("se llega a los ajustes desde la cabecera", async ({ page }) => {
    await registrarseConEquipo(page, "navega", "Equipo Navegación");

    await page.getByRole("link", { name: "Equipo" }).click();

    await expect(page).toHaveURL(/\/settings$/);
  });
});
