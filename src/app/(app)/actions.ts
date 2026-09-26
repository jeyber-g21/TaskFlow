"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { obtenerEquipoActual } from "@/lib/queries/workspace";
import {
  projectSchema,
  teamSchema,
  type ProjectInput,
  type TeamInput,
} from "@/lib/validations/workspace";

export type ResultadoAccion =
  | { status: "error"; message: string }
  | { status: "ok" };

/** Mensajes según el código que devuelve Postgres, no según su texto. */
function traducirErrorDeDatos(codigo?: string): string {
  switch (codigo) {
    case "42501":
      return "No tienes permisos para hacer esto.";
    case "23505":
      return "Ya existe un elemento con ese nombre.";
    case "23503":
      return "El elemento al que haces referencia ya no existe.";
    default:
      return "No hemos podido guardar los cambios. Inténtalo de nuevo.";
  }
}

/**
 * Crea el equipo y deja a quien lo crea como administrador.
 *
 * Es una llamada a una función de la base de datos y no un INSERT: las dos
 * escrituras tienen que ocurrir juntas, porque un equipo sin miembros no
 * permitiría a ninguna política decidir quién puede añadir el primero.
 */
export async function crearEquipo(input: TeamInput): Promise<ResultadoAccion> {
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_team", {
    team_name: parsed.data.name,
  });

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function crearProyecto(
  input: ProjectInput,
): Promise<ResultadoAccion> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  // El equipo se resuelve en el servidor a partir de la sesión. Si viniera
  // del formulario, cualquiera podría cambiarlo por el de otro equipo: RLS lo
  // rechazaría igualmente, pero no conviene ni ofrecer el hueco.
  const equipo = await obtenerEquipoActual();
  if (!equipo) {
    return { status: "error", message: "Todavía no perteneces a ningún equipo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    team_id: equipo.id,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code) };
  }

  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function editarProyecto(
  id: string,
  input: ProjectInput,
): Promise<ResultadoAccion> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ name: parsed.data.name, description: parsed.data.description })
    .eq("id", id)
    .select("id");

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code) };
  }
  // RLS no lanza error al actualizar: simplemente no alcanza ninguna fila.
  // Sin esta comprobación, editar un proyecto ajeno parecería funcionar.
  if (!data?.length) {
    return { status: "error", message: "No hemos encontrado ese proyecto." };
  }

  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function borrarProyecto(id: string): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code) };
  }
  if (!data?.length) {
    return {
      status: "error",
      message: "No se ha borrado: solo los administradores pueden eliminar proyectos.",
    };
  }

  revalidatePath("/dashboard");
  return { status: "ok" };
}
