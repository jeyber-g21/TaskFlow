import "server-only";

import { calcularIniciales } from "@/lib/nombres";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/db/schema";
import type { TaskPriorityValue, TaskStatusValue } from "@/lib/validations/task";
import {
  SIN_RESPONSABLE,
  TODOS,
  type Filtros,
} from "@/lib/validations/filtros";

export type Responsable = {
  id: string;
  nombre: string;
  iniciales: string;
};

export type TareaConResponsable = Pick<
  Task,
  "id" | "title" | "description" | "createdAt"
> & {
  estado: TaskStatusValue;
  prioridad: TaskPriorityValue;
  responsable: Responsable | null;
};

/**
 * Escapa lo que se mete en un filtro `or` de PostgREST.
 *
 * Su sintaxis separa condiciones por comas y agrupa con paréntesis, así que un
 * término de búsqueda con esos caracteres rompería la consulta. Las comillas
 * tampoco pueden pasar tal cual.
 */
function escaparParaBusqueda(texto: string): string {
  return texto.replace(/[,()\\"]/g, " ");
}

export async function obtenerTareas(
  proyectoId: string,
  filtros?: Filtros,
): Promise<TareaConResponsable[]> {
  const supabase = await createClient();

  let consulta = supabase
    .from("tasks")
    .select("id, title, description, status, priority, created_at, profiles(id, full_name)")
    .eq("project_id", proyectoId);

  // Los filtros se aplican en Postgres y no en JavaScript: traerse todas las
  // tareas para descartarlas después no escala, y además deja pasar trabajo
  // que la base de datos hace mejor.
  if (filtros?.prioridad && filtros.prioridad !== TODOS) {
    consulta = consulta.eq("priority", filtros.prioridad);
  }

  if (filtros?.responsable && filtros.responsable !== TODOS) {
    consulta =
      filtros.responsable === SIN_RESPONSABLE
        ? consulta.is("assignee_id", null)
        : consulta.eq("assignee_id", filtros.responsable);
  }

  if (filtros?.q) {
    const termino = escaparParaBusqueda(filtros.q);
    // Busca en el título y en la descripción; `ilike` ignora mayúsculas.
    consulta = consulta.or(
      `title.ilike.%${termino}%,description.ilike.%${termino}%`,
    );
  }

  const { data, error } = await consulta.order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((tarea) => {
    const perfil = tarea.profiles as unknown as
      | { id: string; full_name: string }
      | null;

    return {
      id: tarea.id,
      title: tarea.title,
      description: tarea.description,
      createdAt: new Date(tarea.created_at),
      estado: tarea.status as TaskStatusValue,
      prioridad: tarea.priority as TaskPriorityValue,
      responsable: perfil
        ? {
            id: perfil.id,
            nombre: perfil.full_name,
            iniciales: calcularIniciales(perfil.full_name),
          }
        : null,
    };
  });
}

/**
 * Miembros del equipo, para el desplegable de responsable.
 *
 * Solo devuelve a quienes comparten equipo: las políticas sobre `profiles` no
 * dejan ver a nadie más, así que la lista nunca puede filtrar desconocidos.
 */
export async function obtenerMiembros(equipoId: string): Promise<Responsable[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memberships")
    .select("profiles(id, full_name)")
    .eq("team_id", equipoId);

  if (error || !data) return [];

  return data
    .map((fila) => fila.profiles as unknown as { id: string; full_name: string } | null)
    .filter((perfil): perfil is { id: string; full_name: string } => perfil !== null)
    .map((perfil) => ({
      id: perfil.id,
      nombre: perfil.full_name,
      iniciales: calcularIniciales(perfil.full_name),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
