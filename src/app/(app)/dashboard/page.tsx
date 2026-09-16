import type { Metadata } from "next";
import { FolderPlus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nombre =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    "de nuevo";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Hola, {nombre}</h1>
      <p className="mt-2 text-muted-foreground">
        Aquí verás los proyectos de tu equipo.
      </p>

      <Card className="mt-8">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderPlus className="size-5" aria-hidden />
          </span>
          <p className="font-medium">Aún no hay proyectos</p>
          <p className="max-w-sm text-sm text-pretty text-muted-foreground">
            Los equipos y los proyectos llegan en la siguiente fase. Por ahora,
            que estés viendo esta pantalla significa que tu sesión funciona.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
