import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KanbanSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return { title: data?.name ?? "Proyecto" };
}

export default async function ProyectoPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: proyecto } = await supabase
    .from("projects")
    .select("id, name, description")
    .eq("id", id)
    .maybeSingle();

  // Si el proyecto es de otro equipo, RLS no devuelve la fila y aquí se ve
  // igual que si no existiera. Es justo lo que queremos: no confirmar a nadie
  // que un identificador ajeno es válido.
  if (!proyecto) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard">
          <ArrowLeft />
          Volver al panel
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">{proyecto.name}</h1>
      {proyecto.description && (
        <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
          {proyecto.description}
        </p>
      )}

      <Card className="mt-8">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KanbanSquare className="size-5" aria-hidden />
          </span>
          <p className="font-medium">El tablero llega en la siguiente fase</p>
          <p className="max-w-sm text-sm text-pretty text-muted-foreground">
            Aquí irán las tres columnas con las tareas del proyecto, con
            responsable y prioridad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
