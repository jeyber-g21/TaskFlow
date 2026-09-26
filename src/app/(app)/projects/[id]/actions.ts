"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  taskSchema,
  taskStatusEnum,
  type TaskInput,
  type TaskStatusValue,
} from "@/lib/validations/task";

export type ResultadoTarea =
  | { status: "error"; message: string }
  | { status: "ok" };

function traducirErrorDeDatos(codigo?: string): string {
  switch (codigo) {
    case "42501":
      return "No tienes permisos para hacer esto.";
    case "23503":
      return "El proyecto o el responsable ya no existen.";
    default:
      return "No hemos podido guardar los cambios. Inténtalo de nuevo.";
  }
}

export async function crearTarea(
  proyectoId: string,
  input: TaskInput,
): Promise<ResultadoTarea> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    project_id: proyectoId,
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    priority: parsed.data.priority,
    assignee_id: parsed.data.assigneeId,
  });

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code) };
  }

  revalidatePath(`/projects/${proyectoId}`);
  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function editarTarea(
  proyectoId: string,
  tareaId: string,
  input: TaskInput,
): Promise<ResultadoTarea> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assignee_id: parsed.data.assigneeId,
    })
    .eq("id", tareaId)
    .select("id");

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code) };
  }
  // RLS bloquea sin lanzar error: si no se tocó ninguna fila, no había permiso.
  if (!data?.length) {
    return { status: "error", message: "No hemos encontrado esa tarea." };
  }

  revalidatePath(`/projects/${proyectoId}`);
  revalidatePath("/dashboard");
  return { status: "ok" };
}

/**
 * Mover una tarea de columna es su propia acción y no un `editarTarea`
 * completo: así el tablero manda solo el estado nuevo, sin arrastrar el resto
 * de campos ni arriesgarse a pisar un cambio que otra persona acabe de hacer.
 */
export async function moverTarea(
  proyectoId: string,
  tareaId: string,
  estado: TaskStatusValue,
): Promise<ResultadoTarea> {
  const parsed = taskStatusEnum.safeParse(estado);
  if (!parsed.success) {
    return { status: "error", message: "Ese estado no existe." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: parsed.data })
    .eq("id", tareaId)
    .select("id");

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code) };
  }
  if (!data?.length) {
    return { status: "error", message: "No hemos encontrado esa tarea." };
  }

  revalidatePath(`/projects/${proyectoId}`);
  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function borrarTarea(
  proyectoId: string,
  tareaId: string,
): Promise<ResultadoTarea> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", tareaId)
    .select("id");

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code) };
  }
  if (!data?.length) {
    return { status: "error", message: "No hemos encontrado esa tarea." };
  }

  revalidatePath(`/projects/${proyectoId}`);
  revalidatePath("/dashboard");
  return { status: "ok" };
}
