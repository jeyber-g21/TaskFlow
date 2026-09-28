import { z } from "zod";

import { memberRole } from "@/lib/db/schema";

export const memberRoleEnum = z.enum(memberRole.enumValues);

export const invitationSchema = z.object({
  email: z.email({ message: "Introduce un email válido." }),
  role: memberRoleEnum,
});

export const cambioDeRolSchema = z.object({
  membershipId: z.uuid({ message: "Miembro no válido." }),
  role: memberRoleEnum,
});

export type InvitationInput = z.infer<typeof invitationSchema>;
export type MemberRoleValue = z.infer<typeof memberRoleEnum>;

export const ETIQUETAS_ROL: Record<MemberRoleValue, string> = {
  admin: "Administrador",
  member: "Miembro",
};

export const DESCRIPCIONES_ROL: Record<MemberRoleValue, string> = {
  admin: "Gestiona el equipo: invita, cambia roles y borra proyectos.",
  member: "Colabora en los proyectos y las tareas del equipo.",
};

/** Días que vale un código antes de caducar. */
export const DIAS_DE_VALIDEZ = 7;
