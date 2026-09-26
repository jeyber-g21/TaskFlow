import "server-only";

import { calcularIniciales } from "@/lib/nombres";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/db/schema";
import type { TaskPriorityValue, TaskStatusValue } from "@/lib/validations/task";

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

export async function obtenerTareas(
  proyectoId: string,
): Promise<TareaConResponsable[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, status, priority, created_at, profiles(id, full_name)")
    .eq("project_id", proyectoId)
    .order("created_at", { ascending: true });

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
