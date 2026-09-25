import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

import { cargarEntornoLocal } from "./entorno";

// Se carga aquí y no en un setupFile: así el archivo funciona igual lo
// ejecute Vitest, Node a secas o el editor.
cargarEntornoLocal();

/**
 * Estos tests no comprueban la interfaz: comprueban que Postgres rechaza las
 * operaciones aunque alguien llame directamente a la API saltándose la app.
 *
 * Es la diferencia entre decir "usamos RLS" y demostrarlo.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const DIRECT_URL = process.env.DIRECT_URL;

const hayCredenciales = Boolean(URL && KEY && DIRECT_URL);

// Sin credenciales no se falla: se avisa y se salta. Así quien clone el repo
// puede ejecutar la batería sin configurar una base de datos.
const describeSiHayCredenciales = hayCredenciales ? describe : describe.skip;

const DOMINIO_PRUEBAS = "taskflow-pruebas.dev";
const CONTRASENA = "contrasena-de-prueba-2026";

type Usuario = {
  cliente: SupabaseClient;
  id: string;
  email: string;
};

async function registrarUsuario(etiqueta: string): Promise<Usuario> {
  const cliente = createClient(URL!, KEY!);
  const email = `rls-${etiqueta}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${DOMINIO_PRUEBAS}`;

  const { data, error } = await cliente.auth.signUp({
    email,
    password: CONTRASENA,
    options: { data: { full_name: `Usuario ${etiqueta.toUpperCase()}` } },
  });

  if (error) throw new Error(`No se pudo registrar ${etiqueta}: ${error.message}`);
  if (!data.session) {
    throw new Error(
      `${etiqueta} se registró sin sesión. ¿Está activada la confirmación por email en Supabase?`,
    );
  }

  return { cliente, id: data.user!.id, email };
}

describeSiHayCredenciales("permisos a nivel de fila (RLS)", () => {
  let ana: Usuario;
  let bruno: Usuario;
  let equipoDeAna: string;
  let proyectoDeAna: { id: string };
  let tareaDeAna: { id: string; updated_at: string };

  beforeAll(async () => {
    ana = await registrarUsuario("ana");
    bruno = await registrarUsuario("bruno");

    const { data: equipo, error: errorEquipo } = await ana.cliente.rpc("create_team", {
      team_name: "Equipo de Ana",
    });
    if (errorEquipo) throw new Error(`create_team falló: ${errorEquipo.message}`);
    equipoDeAna = equipo;

    const { data: proyecto, error: errorProyecto } = await ana.cliente
      .from("projects")
      .insert({ team_id: equipoDeAna, name: "Proyecto privado" })
      .select()
      .single();
    if (errorProyecto) throw new Error(`insert de proyecto falló: ${errorProyecto.message}`);
    proyectoDeAna = proyecto;

    const { data: tarea, error: errorTarea } = await ana.cliente
      .from("tasks")
      .insert({ project_id: proyectoDeAna.id, title: "Tarea confidencial", priority: "high" })
      .select()
      .single();
    if (errorTarea) throw new Error(`insert de tarea falló: ${errorTarea.message}`);
    tareaDeAna = tarea;
  });

  afterAll(async () => {
    // Se limpia por conexión directa: borrar el usuario arrastra en cascada su
    // perfil y sus membresías, y después caen los equipos que quedan vacíos.
    const sql = postgres(DIRECT_URL!, { max: 1, prepare: false });
    try {
      await sql`delete from auth.users where email like ${"rls-%@" + DOMINIO_PRUEBAS}`;
      await sql`
        delete from public.teams t
        where not exists (select 1 from public.memberships m where m.team_id = t.id)
      `;
    } finally {
      await sql.end();
    }
  });

  describe("al registrarse", () => {
    it("el trigger crea el perfil automáticamente", async () => {
      const { data } = await ana.cliente
        .from("profiles")
        .select("*")
        .eq("id", ana.id)
        .single();

      expect(data?.id).toBe(ana.id);
      expect(data?.full_name).toBe("Usuario ANA");
    });
  });

  describe("create_team()", () => {
    it("deja a quien lo crea como administrador", async () => {
      const { data } = await ana.cliente
        .from("memberships")
        .select("*")
        .eq("team_id", equipoDeAna);

      expect(data).toHaveLength(1);
      expect(data?.[0].role).toBe("admin");
      expect(data?.[0].user_id).toBe(ana.id);
    });

    it("rechaza un nombre vacío", async () => {
      const { error } = await ana.cliente.rpc("create_team", { team_name: "   " });

      expect(error).not.toBeNull();
    });
  });

  describe("un usuario ajeno no puede leer", () => {
    it("no ve el equipo", async () => {
      const { data } = await bruno.cliente.from("teams").select("*");
      expect(data).toHaveLength(0);
    });

    it("no ve los proyectos", async () => {
      const { data } = await bruno.cliente.from("projects").select("*");
      expect(data).toHaveLength(0);
    });

    it("no ve las tareas", async () => {
      const { data } = await bruno.cliente.from("tasks").select("*");
      expect(data).toHaveLength(0);
    });

    it("tampoco ve la tarea pidiéndola por su id", async () => {
      // Conocer el id no da acceso: el filtro lo aplica Postgres, no la app.
      const { data } = await bruno.cliente.from("tasks").select("*").eq("id", tareaDeAna.id);
      expect(data).toHaveLength(0);
    });

    it("no ve el perfil de alguien con quien no comparte equipo", async () => {
      const { data } = await bruno.cliente.from("profiles").select("*").eq("id", ana.id);
      expect(data).toHaveLength(0);
    });
  });

  describe("un usuario ajeno no puede escribir", () => {
    it("no puede crear proyectos en un equipo que no es suyo", async () => {
      const { error } = await bruno.cliente
        .from("projects")
        .insert({ team_id: equipoDeAna, name: "Proyecto infiltrado" });

      // 42501 es el código de Postgres para violación de permisos.
      expect(error?.code).toBe("42501");
    });

    it("no puede crear tareas en un proyecto ajeno", async () => {
      const { error } = await bruno.cliente
        .from("tasks")
        .insert({ project_id: proyectoDeAna.id, title: "Tarea infiltrada" });

      expect(error?.code).toBe("42501");
    });

    it("no puede añadirse al equipo por su cuenta", async () => {
      const { error } = await bruno.cliente
        .from("memberships")
        .insert({ team_id: equipoDeAna, user_id: bruno.id, role: "admin" });

      expect(error?.code).toBe("42501");
    });

    it("no puede modificar una tarea ajena", async () => {
      // Un UPDATE que no alcanza ninguna fila no da error: simplemente no
      // afecta a nada. Por eso se comprueba el número de filas devueltas.
      const { data } = await bruno.cliente
        .from("tasks")
        .update({ title: "Secuestrada" })
        .eq("id", tareaDeAna.id)
        .select();

      expect(data).toHaveLength(0);
    });

    it("no puede borrar una tarea ajena", async () => {
      const { data } = await bruno.cliente
        .from("tasks")
        .delete()
        .eq("id", tareaDeAna.id)
        .select();

      expect(data).toHaveLength(0);
    });
  });

  describe("el dueño sí puede trabajar con lo suyo", () => {
    it("ve sus tareas", async () => {
      const { data } = await ana.cliente.from("tasks").select("*");
      expect(data).toHaveLength(1);
      expect(data?.[0].title).toBe("Tarea confidencial");
    });

    it("puede mover una tarea de columna y el trigger actualiza updated_at", async () => {
      const { data } = await ana.cliente
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", tareaDeAna.id)
        .select()
        .single();

      expect(data?.status).toBe("in_progress");
      expect(new Date(data!.updated_at).getTime()).toBeGreaterThan(
        new Date(tareaDeAna.updated_at).getTime(),
      );
    });
  });

  describe("sin sesión", () => {
    it("no se obtiene ningún dato", async () => {
      const anonimo = createClient(URL!, KEY!);
      const { data } = await anonimo.from("projects").select("*");

      expect(data ?? []).toHaveLength(0);
    });
  });
});
