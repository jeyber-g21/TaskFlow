import type { Metadata } from "next";
import Link from "next/link";

import { JoinButton } from "@/components/workspace/join-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DESCRIPCIONES_ROL, ETIQUETAS_ROL, type MemberRoleValue } from "@/lib/validations/invitation";

export const metadata: Metadata = {
  title: "Unirse a un equipo",
};

const MOTIVOS: Record<string, string> = {
  no_existe: "Este enlace de invitación no existe. Puede que esté mal copiado.",
  ya_usada: "Esta invitación ya se usó. Pide una nueva a quien te invitó.",
  caducada: "Esta invitación ha caducado. Pide una nueva a quien te invitó.",
};

export default async function UnirsePage({ params }: PageProps<"/unirse/[token]">) {
  const { token } = await params;

  const supabase = await createClient();

  // Se consulta con una función de la base de datos porque quien llega con el
  // código todavía no pertenece al equipo: ninguna política le dejaría leer la
  // invitación directamente.
  const { data, error } = await supabase.rpc("peek_invitation", {
    invitation_token: token,
  });

  const invitacion = Array.isArray(data) ? data[0] : data;

  if (error || !invitacion) {
    return (
      <Mensaje
        titulo="Invitación no válida"
        texto={MOTIVOS.no_existe}
      />
    );
  }

  if (!invitacion.valid) {
    return (
      <Mensaje
        titulo="Invitación no válida"
        texto={MOTIVOS[invitacion.reason ?? "no_existe"] ?? MOTIVOS.no_existe}
      />
    );
  }

  const rol = invitacion.role as MemberRoleValue;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Te han invitado a {invitacion.team_name}</CardTitle>
          <CardDescription>
            Entrarás como <strong>{ETIQUETAS_ROL[rol].toLowerCase()}</strong>.{" "}
            {DESCRIPCIONES_ROL[rol]}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <JoinButton token={token} nombreEquipo={invitacion.team_name} />
        </CardContent>
      </Card>
    </div>
  );
}

function Mensaje({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{texto}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">Ir a mi panel</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
