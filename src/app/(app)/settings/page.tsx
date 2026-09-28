import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";

import { InvitationRow } from "@/components/workspace/invitation-row";
import { InviteForm } from "@/components/workspace/invite-form";
import { MemberRow } from "@/components/workspace/member-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  obtenerInvitacionesPendientes,
  obtenerMiembrosDelEquipo,
} from "@/lib/queries/equipo";
import { obtenerEquipoActual } from "@/lib/queries/workspace";

export const metadata: Metadata = {
  title: "Ajustes del equipo",
};

export default async function AjustesPage() {
  const equipo = await obtenerEquipoActual();
  if (!equipo) {
    redirect("/bienvenida");
  }

  const esAdmin = equipo.rol === "admin";

  const [miembros, invitaciones] = await Promise.all([
    obtenerMiembrosDelEquipo(equipo.id),
    // Quien no gestiona el equipo no necesita ver los códigos pendientes.
    esAdmin ? obtenerInvitacionesPendientes(equipo.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard">
          <ArrowLeft />
          Volver al panel
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">{equipo.name}</h1>
      <p className="mt-1 text-muted-foreground">
        {miembros.length === 1
          ? "Estás tú solo en el equipo."
          : `${miembros.length} personas en el equipo.`}
      </p>

      {esAdmin && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Invitar al equipo</CardTitle>
            <CardDescription>
              A quien invites le aparecerá la invitación al entrar en TaskFlow
              con ese email. También puedes pasarle el enlace directamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm />
          </CardContent>
        </Card>
      )}

      {esAdmin && invitaciones.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Invitaciones pendientes</CardTitle>
            <CardDescription>
              Siguen siendo válidas hasta que se usen o caduquen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {invitaciones.map((invitacion) => (
                <InvitationRow key={invitacion.id} invitacion={invitacion} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Miembros</CardTitle>
          {!esAdmin && (
            <CardDescription>
              Solo los administradores pueden invitar o cambiar roles.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {miembros.map((miembro) => (
              <MemberRow
                key={miembro.membershipId}
                miembro={miembro}
                puedeGestionar={esAdmin}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      {esAdmin && miembros.filter((m) => m.rol === "admin").length === 1 && (
        <Alert className="mt-6">
          <Info />
          <AlertDescription>
            Eres el único administrador. Un equipo necesita al menos uno, así
            que no podrás dejar de serlo hasta nombrar a otro.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
