import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { JoinButton } from "@/components/workspace/join-button";
import { TeamForm } from "@/components/workspace/team-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { obtenerMisInvitaciones } from "@/lib/queries/equipo";
import { obtenerEquipoActual } from "@/lib/queries/workspace";
import { createClient } from "@/lib/supabase/server";
import { ETIQUETAS_ROL } from "@/lib/validations/invitation";

export const metadata: Metadata = {
  title: "Crea tu equipo",
};

export default async function BienvenidaPage() {
  // Quien ya tiene equipo no pinta nada aquí.
  if (await obtenerEquipoActual()) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nombre = (user?.user_metadata?.full_name as string | undefined)
    ?.split(" ")[0]
    ?.trim();

  // Si a este email lo han invitado, lo primero es enseñarle la invitación:
  // llegar aquí y que solo te ofrezcan crear un equipo, habiendo sido
  // invitado, confunde a cualquiera.
  const invitaciones = await obtenerMisInvitaciones();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-6 px-4 py-16">
      {invitaciones.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>
              {invitaciones.length === 1
                ? `Te han invitado a ${invitaciones[0].nombreEquipo}`
                : "Tienes invitaciones pendientes"}
            </CardTitle>
            <CardDescription>
              {invitaciones.length === 1
                ? "Únete y empieza a trabajar con el equipo."
                : "Elige a cuál te unes."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {invitaciones.map((invitacion) => (
              <div key={invitacion.token} className="space-y-2">
                {invitaciones.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{invitacion.nombreEquipo}</span>
                    <Badge
                      variant={invitacion.rol === "admin" ? "default" : "secondary"}
                    >
                      {ETIQUETAS_ROL[invitacion.rol]}
                    </Badge>
                  </div>
                )}

                <JoinButton
                  token={invitacion.token}
                  nombreEquipo={invitacion.nombreEquipo}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {invitaciones.length > 0
              ? "O crea tu propio equipo"
              : nombre
                ? `Bienvenido, ${nombre}`
                : "Bienvenido a TaskFlow"}
          </CardTitle>
          <CardDescription>
            Todo el trabajo vive dentro de un equipo. Crea el tuyo para empezar;
            más adelante podrás invitar a quien colabore contigo.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <TeamForm sugerencia={nombre ? `Equipo de ${nombre}` : ""} />
        </CardContent>
      </Card>
    </div>
  );
}
