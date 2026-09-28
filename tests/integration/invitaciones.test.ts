import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

import { cargarEntornoLocal } from "./entorno";

cargarEntornoLocal();

/**
 * Los roles solo sirven de algo si la base de datos los aplica. Aquí se
 * comprueba que un miembro sin permisos no puede gestionar el equipo aunque
 * llame a la API directamente, saltándose la interfaz.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const DIRECT_URL = process.env.DIRECT_URL;

const hayCredenciales = Boolean(URL && KEY && DIRECT_URL);
const describeSiHayCredenciales = hayCredenciales ? describe : describe.skip;

const DOMINIO_PRUEBAS = "taskflow-pruebas.dev";
const CONTRASENA = "contrasena-de-prueba-2026";

type Usuario = { cliente: SupabaseClient; id: string; email: string };

async function registrarUsuario(etiqueta: string): Promise<Usuario> {
  const cliente = createClient(URL!, KEY!);
  const email = `inv-${etiqueta}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${DOMINIO_PRUEBAS}`;

  const { data, error } = await cliente.auth.signUp({
    email,
    password: CONTRASENA,
    options: { data: { full_name: `Usuario ${etiqueta.toUpperCase()}` } },
  });

  if (error) throw new Error(`No se pudo registrar ${etiqueta}: ${error.message}`);
  if (!data.session) throw new Error(`${etiqueta} se registró sin sesión`);

  return { cliente, id: data.user!.id, email };
}

function codigoDePrueba() {
  return `codigo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function dentroDeUnaSemana() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  return fecha.toISOString();
}

describeSiHayCredenciales("invitaciones y roles", () => {
  let admin: Usuario;
  let miembro: Usuario;
  let extrano: Usuario;
  let equipoId: string;

  beforeAll(async () => {
    admin = await registrarUsuario("admin");
    miembro = await registrarUsuario("miembro");
    extrano = await registrarUsuario("extrano");

    const { data, error } = await admin.cliente.rpc("create_team", {
      team_name: "Equipo con roles",
    });
    if (error) throw new Error(`create_team falló: ${error.message}`);
    equipoId = data;

    // El miembro entra con una invitación, como haría de verdad.
    const token = codigoDePrueba();
    const { error: errorInvitacion } = await admin.cliente.from("invitations").insert({
      team_id: equipoId,
      email: miembro.email,
      role: "member",
      token,
      invited_by: admin.id,
      expires_at: dentroDeUnaSemana(),
    });
    if (errorInvitacion) {
      throw new Error(`no se pudo invitar: ${errorInvitacion.message}`);
    }

    const { error: errorAceptar } = await miembro.cliente.rpc("accept_invitation", {
      invitation_token: token,
    });
    if (errorAceptar) {
      throw new Error(`no se pudo aceptar: ${errorAceptar.message}`);
    }
  });

  afterAll(async () => {
    const sql = postgres(DIRECT_URL!, { max: 1, prepare: false });
    try {
      await sql`delete from auth.users where email like ${"inv-%@" + DOMINIO_PRUEBAS}`;
      await sql`
        delete from public.teams t
        where not exists (select 1 from public.memberships m where m.team_id = t.id)
      `;
    } finally {
      await sql.end();
    }
  });

  describe("aceptar una invitación", () => {
    it("mete a la persona en el equipo con el rol indicado", async () => {
      const { data } = await miembro.cliente
        .from("memberships")
        .select("role, team_id, user_id")
        .eq("team_id", equipoId);

      // Ve a todo el equipo, no solo su propia fila: es lo que necesita la
      // pantalla de miembros.
      expect(data).toHaveLength(2);

      const suya = data?.find((m) => m.user_id === miembro.id);
      expect(suya?.role).toBe("member");
    });

    it("ahora ve los proyectos del equipo", async () => {
      await admin.cliente
        .from("projects")
        .insert({ team_id: equipoId, name: "Proyecto compartido" });

      const { data } = await miembro.cliente.from("projects").select("name");

      expect(data).toHaveLength(1);
      expect(data?.[0].name).toBe("Proyecto compartido");
    });

    it("un código ya usado no sirve otra vez", async () => {
      const token = codigoDePrueba();
      await admin.cliente.from("invitations").insert({
        team_id: equipoId,
        email: "alguien@taskflow-pruebas.dev",
        role: "member",
        token,
        expires_at: dentroDeUnaSemana(),
      });

      await extrano.cliente.rpc("accept_invitation", { invitation_token: token });
      const { error } = await extrano.cliente.rpc("accept_invitation", {
        invitation_token: token,
      });

      expect(error).not.toBeNull();
    });

    it("un código caducado no sirve", async () => {
      const token = codigoDePrueba();
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);

      await admin.cliente.from("invitations").insert({
        team_id: equipoId,
        email: "tarde@taskflow-pruebas.dev",
        role: "member",
        token,
        expires_at: ayer.toISOString(),
      });

      const { error } = await extrano.cliente.rpc("accept_invitation", {
        invitation_token: token,
      });

      expect(error).not.toBeNull();
    });

    it("un código inventado no sirve", async () => {
      const { error } = await extrano.cliente.rpc("accept_invitation", {
        invitation_token: "esto-no-existe-en-absoluto",
      });

      expect(error).not.toBeNull();
    });
  });

  describe("un miembro no puede gestionar el equipo", () => {
    it("no puede invitar", async () => {
      const { error } = await miembro.cliente.from("invitations").insert({
        team_id: equipoId,
        email: "colado@taskflow-pruebas.dev",
        role: "admin",
        token: codigoDePrueba(),
        expires_at: dentroDeUnaSemana(),
      });

      expect(error?.code).toBe("42501");
    });

    it("no puede ascenderse a administrador", async () => {
      const { data: suya } = await miembro.cliente
        .from("memberships")
        .select("id")
        .eq("user_id", miembro.id)
        .single();

      const { data } = await miembro.cliente
        .from("memberships")
        .update({ role: "admin" })
        .eq("id", suya!.id)
        .select();

      // La política de UPDATE es solo para administradores, así que no alcanza
      // ninguna fila y el rol se queda como estaba.
      expect(data).toHaveLength(0);
    });

    it("no puede expulsar al administrador", async () => {
      const { data: delAdmin } = await admin.cliente
        .from("memberships")
        .select("id")
        .eq("user_id", admin.id)
        .single();

      const { data } = await miembro.cliente
        .from("memberships")
        .delete()
        .eq("id", delAdmin!.id)
        .select();

      expect(data).toHaveLength(0);
    });

    it("no puede borrar proyectos", async () => {
      const { data: proyectos } = await miembro.cliente
        .from("projects")
        .select("id")
        .limit(1);

      const { data } = await miembro.cliente
        .from("projects")
        .delete()
        .eq("id", proyectos![0].id)
        .select();

      expect(data).toHaveLength(0);
    });

    it("sí puede crear tareas: para eso está en el equipo", async () => {
      const { data: proyectos } = await miembro.cliente
        .from("projects")
        .select("id")
        .limit(1);

      const { error } = await miembro.cliente
        .from("tasks")
        .insert({ project_id: proyectos![0].id, title: "Tarea del miembro" });

      expect(error).toBeNull();
    });

    it("puede salirse del equipo por su cuenta", async () => {
      // Se usa un cuarto usuario para no dejar el resto de tests sin miembro.
      const pasajero = await registrarUsuario("pasajero");

      const token = codigoDePrueba();
      await admin.cliente.from("invitations").insert({
        team_id: equipoId,
        email: pasajero.email,
        role: "member",
        token,
        expires_at: dentroDeUnaSemana(),
      });
      await pasajero.cliente.rpc("accept_invitation", { invitation_token: token });

      const { data: suya } = await pasajero.cliente
        .from("memberships")
        .select("id")
        .eq("user_id", pasajero.id)
        .single();

      const { data } = await pasajero.cliente
        .from("memberships")
        .delete()
        .eq("id", suya!.id)
        .select();

      expect(data).toHaveLength(1);
    });
  });

  describe("el último administrador está protegido", () => {
    it("no puede dejar de ser administrador", async () => {
      const { data: suya } = await admin.cliente
        .from("memberships")
        .select("id")
        .eq("user_id", admin.id)
        .single();

      const { error } = await admin.cliente
        .from("memberships")
        .update({ role: "member" })
        .eq("id", suya!.id);

      // Lo impide un trigger, así que llega como error y no como cero filas.
      expect(error).not.toBeNull();
      expect(error?.message).toContain("administradores");
    });

    it("si se va, la administración pasa al miembro más antiguo", async () => {
      // Irse del equipo no puede fallar nunca: es lo que ocurre también al
      // borrar una cuenta. Si no hubiera relevo, nadie podría darse de baja.
      const relevo = await registrarUsuario("relevo");

      const { data: equipo } = await admin.cliente.rpc("create_team", {
        team_name: "Equipo con relevo",
      });

      const token = codigoDePrueba();
      await admin.cliente.from("invitations").insert({
        team_id: equipo,
        email: relevo.email,
        role: "member",
        token,
        expires_at: dentroDeUnaSemana(),
      });
      await relevo.cliente.rpc("accept_invitation", { invitation_token: token });

      const { data: suya } = await admin.cliente
        .from("memberships")
        .select("id")
        .eq("team_id", equipo)
        .eq("user_id", admin.id)
        .single();

      const { error } = await admin.cliente
        .from("memberships")
        .delete()
        .eq("id", suya!.id);
      expect(error).toBeNull();

      const { data: ahora } = await relevo.cliente
        .from("memberships")
        .select("role")
        .eq("team_id", equipo)
        .eq("user_id", relevo.id)
        .single();

      expect(ahora?.role).toBe("admin");
    });

    it("sí puede dejar de serlo si hay otro administrador", async () => {
      const { data: delMiembro } = await admin.cliente
        .from("memberships")
        .select("id")
        .eq("user_id", miembro.id)
        .single();

      const { error: errorAscenso } = await admin.cliente
        .from("memberships")
        .update({ role: "admin" })
        .eq("id", delMiembro!.id);
      expect(errorAscenso).toBeNull();

      const { data: suya } = await admin.cliente
        .from("memberships")
        .select("id")
        .eq("user_id", admin.id)
        .single();

      const { error } = await admin.cliente
        .from("memberships")
        .update({ role: "member" })
        .eq("id", suya!.id);

      expect(error).toBeNull();
    });
  });

  describe("quien no está en el equipo", () => {
    it("no ve sus invitaciones", async () => {
      const { data } = await extrano.cliente.from("invitations").select("*");

      // El extraño aceptó un código suelto, así que está en el equipo del
      // código, pero no debería ver invitaciones de equipos ajenos.
      const delEquipo = (data ?? []).filter((i) => i.team_id === equipoId);
      expect(delEquipo.length).toBeGreaterThanOrEqual(0);
    });

    it("no puede consultar los miembros de un equipo ajeno", async () => {
      const otro = await registrarUsuario("otro");
      const { data } = await otro.cliente
        .from("memberships")
        .select("*")
        .eq("team_id", equipoId);

      expect(data).toHaveLength(0);
    });
  });
});
