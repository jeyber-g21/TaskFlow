import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TeamForm } from "@/components/workspace/team-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { obtenerEquipoActual } from "@/lib/queries/workspace";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>
            {nombre ? `Bienvenido, ${nombre}` : "Bienvenido a TaskFlow"}
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
