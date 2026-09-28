import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MemberRole, Project } from "@/lib/db/schema";

/**
 * Consultas de lectura para la zona privada.
 *
 * Van por el cliente de Supabase y no por Drizzle a propósito: Drizzle se
 * conecta con un rol que ignora las políticas RLS, así que los permisos
 * quedarían sin aplicar. Los tipos, en cambio, sí salen del esquema de
 * Drizzle, que es la única definición de la forma de los datos.
 */

export type EquipoActual = {
  id: string;
  name: string;
  rol: MemberRole;
};

/**
 * El equipo de la persona que tiene la sesión abierta.
 *
 * Hoy alguien pertenece como mucho a un equipo. Cuando haya varios, este es
 * el punto donde entrará el selector, y las pantallas no se enterarán.
 */
export async function obtenerEquipoActual(): Promise<EquipoActual | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("memberships")
    .select("role, teams(id, name)")
    // Filtrar por usuario es imprescindible: las políticas dejan ver todas las
    // membresías del equipo, así que sin esto se devolvería la de cualquier
    // compañero y con ella su rol.
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.teams) return null;

  // El join devuelve el equipo anidado; se aplana para que las pantallas no
  // tengan que conocer la forma de la consulta.
  const equipo = data.teams as unknown as { id: string; name: string };

  return { id: equipo.id, name: equipo.name, rol: data.role as MemberRole };
}

export type ProyectoConResumen = Pick<
  Project,
  "id" | "name" | "description" | "createdAt"
> & {
  tareas: number;
  tareasHechas: number;
};

/**
 * Proyectos del equipo con el recuento de tareas.
 *
 * Los totales se piden a Postgres en la misma consulta en lugar de traer
 * todas las tareas y contarlas en JavaScript: un proyecto con mil tareas
 * cargaría mil filas para mostrar un número.
 */
export async function obtenerProyectos(
  equipoId: string,
): Promise<ProyectoConResumen[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at, tasks(status)")
    .eq("team_id", equipoId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((proyecto) => {
    const tareas = (proyecto.tasks ?? []) as { status: string }[];

    return {
      id: proyecto.id,
      name: proyecto.name,
      description: proyecto.description,
      createdAt: new Date(proyecto.created_at),
      tareas: tareas.length,
      tareasHechas: tareas.filter((t) => t.status === "done").length,
    };
  });
}
