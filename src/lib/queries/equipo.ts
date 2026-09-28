import "server-only";

import { calcularIniciales } from "@/lib/nombres";
import { createClient } from "@/lib/supabase/server";
import type { MemberRoleValue } from "@/lib/validations/invitation";

export type MiembroDelEquipo = {
  membershipId: string;
  userId: string;
  nombre: string;
  iniciales: string;
  rol: MemberRoleValue;
  desde: Date;
  esTu: boolean;
};

export type InvitacionPendiente = {
  id: string;
  email: string;
  rol: MemberRoleValue;
  token: string;
  caducaEl: Date;
};

export async function obtenerMiembrosDelEquipo(
  equipoId: string,
): Promise<MiembroDelEquipo[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("memberships")
    .select("id, user_id, role, created_at, profiles(full_name)")
    .eq("team_id", equipoId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((fila) => {
    const perfil = fila.profiles as unknown as { full_name: string } | null;
    const nombre = perfil?.full_name ?? "Sin nombre";

    return {
      membershipId: fila.id,
      userId: fila.user_id,
      nombre,
      iniciales: calcularIniciales(nombre),
      rol: fila.role as MemberRoleValue,
      desde: new Date(fila.created_at),
      // Marcar cuál eres tú evita ofrecerte acciones sobre ti mismo que no
      // tienen sentido, como cambiarte el rol.
      esTu: fila.user_id === user?.id,
    };
  });
}

/**
 * Invitaciones que siguen sirviendo: ni usadas ni caducadas.
 *
 * Las caducadas se dejan en la tabla porque son historial, pero no se
 * enseñan: un código que ya no vale solo confunde.
 */
export async function obtenerInvitacionesPendientes(
  equipoId: string,
): Promise<InvitacionPendiente[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, token, expires_at")
    .eq("team_id", equipoId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((fila) => ({
    id: fila.id,
    email: fila.email,
    rol: fila.role as MemberRoleValue,
    token: fila.token,
    caducaEl: new Date(fila.expires_at),
  }));
}

export type MiInvitacion = {
  token: string;
  nombreEquipo: string;
  rol: MemberRoleValue;
  caducaEl: Date;
};

/**
 * Invitaciones pendientes dirigidas al email de la sesión.
 *
 * Sirve para que quien se registra con un email invitado se encuentre la
 * invitación esperándole, sin tener que recuperar el enlace original.
 */
export async function obtenerMisInvitaciones(): Promise<MiInvitacion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("my_pending_invitations");

  if (error || !data) return [];

  return (data as { token: string; team_name: string; role: string; expires_at: string }[])
    .map((fila) => ({
      token: fila.token,
      nombreEquipo: fila.team_name,
      rol: fila.role as MemberRoleValue,
      caducaEl: new Date(fila.expires_at),
    }));
}
