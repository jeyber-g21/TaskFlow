"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generarCodigo } from "@/lib/invitaciones";
import { obtenerEquipoActual } from "@/lib/queries/workspace";
import { createClient } from "@/lib/supabase/server";
import {
  DIAS_DE_VALIDEZ,
  cambioDeRolSchema,
  invitationSchema,
  type InvitationInput,
  type MemberRoleValue,
} from "@/lib/validations/invitation";

export type ResultadoEquipo =
  | { status: "error"; message: string }
  | { status: "ok" };

function traducirErrorDeDatos(codigo?: string, mensaje?: string): string {
  // Los P000x los lanzan nuestras propias funciones y triggers.
  switch (codigo) {
    case "P0005":
      return "No puedes dejar al equipo sin administradores.";
    case "P0002":
      return "Ese código de invitación no existe.";
    case "P0003":
      return "Esa invitación ya se usó.";
    case "P0004":
      return "Esa invitación ha caducado.";
    case "42501":
      return "Solo los administradores pueden hacer esto.";
    case "23505":
      return "Ya hay una invitación activa para ese email.";
    default:
      return mensaje?.includes("administradores")
        ? "No puedes dejar al equipo sin administradores."
        : "No hemos podido completar la operación. Inténtalo de nuevo.";
  }
}

/**
 * Crea una invitación y devuelve el código.
 *
 * El equipo sale de la sesión, no del formulario: mandar el identificador
 * desde el cliente permitiría intentar invitar a un equipo ajeno. RLS lo
 * rechazaría, pero no hay razón para ofrecer el hueco.
 */
export async function crearInvitacion(
  input: InvitationInput,
): Promise<ResultadoEquipo & { token?: string }> {
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const equipo = await obtenerEquipoActual();
  if (!equipo) {
    return { status: "error", message: "No perteneces a ningún equipo." };
  }
  if (equipo.rol !== "admin") {
    return { status: "error", message: "Solo los administradores pueden invitar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caduca = new Date();
  caduca.setDate(caduca.getDate() + DIAS_DE_VALIDEZ);

  const token = generarCodigo();

  const { error } = await supabase.from("invitations").insert({
    team_id: equipo.id,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    token,
    invited_by: user?.id ?? null,
    expires_at: caduca.toISOString(),
  });

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code, error.message) };
  }

  revalidatePath("/settings");
  return { status: "ok", token };
}

export async function revocarInvitacion(id: string): Promise<ResultadoEquipo> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code, error.message) };
  }
  // RLS bloquea sin error: si no se borró nada, no había permiso.
  if (!data?.length) {
    return { status: "error", message: "Solo los administradores pueden revocar." };
  }

  revalidatePath("/settings");
  return { status: "ok" };
}

export async function cambiarRol(
  membershipId: string,
  rol: MemberRoleValue,
): Promise<ResultadoEquipo> {
  const parsed = cambioDeRolSchema.safeParse({ membershipId, role: rol });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.membershipId)
    .select("id");

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code, error.message) };
  }
  if (!data?.length) {
    return { status: "error", message: "Solo los administradores pueden cambiar roles." };
  }

  revalidatePath("/settings");
  return { status: "ok" };
}

export async function expulsarMiembro(
  membershipId: string,
): Promise<ResultadoEquipo> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId)
    .select("id");

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code, error.message) };
  }
  if (!data?.length) {
    return { status: "error", message: "Solo los administradores pueden expulsar." };
  }

  revalidatePath("/settings");
  return { status: "ok" };
}

/**
 * Se une al equipo con un código.
 *
 * Todo el trabajo lo hace una función de la base de datos: quien llega con el
 * código todavía no pertenece al equipo, así que ninguna política le dejaría
 * leer la invitación ni insertarse en `memberships` por su cuenta.
 */
export async function aceptarInvitacion(token: string): Promise<ResultadoEquipo> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invitation", {
    invitation_token: token,
  });

  if (error) {
    return { status: "error", message: traducirErrorDeDatos(error.code, error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
