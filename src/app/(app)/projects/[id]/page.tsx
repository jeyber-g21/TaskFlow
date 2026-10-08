import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { TaskBoard } from "@/components/tasks/task-board";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Button } from "@/components/ui/button";
import { obtenerMiembros, obtenerTareas } from "@/lib/queries/tasks";
import { obtenerEquipoActual } from "@/lib/queries/workspace";
import { createClient } from "@/lib/supabase/server";
import { hayFiltrosActivos, leerFiltros } from "@/lib/validations/filtros";

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

export default async function ProyectoPage({
  params,
  searchParams,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const filtros = leerFiltros(await searchParams);

  const equipo = await obtenerEquipoActual();
  if (!equipo) {
    redirect("/bienvenida");
  }

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

  const [tareas, miembros] = await Promise.all([
    obtenerTareas(proyecto.id, filtros),
    obtenerMiembros(equipo.id),
  ]);

  const hechas = tareas.filter((t) => t.estado === "done").length;
  const filtrando = hayFiltrosActivos(filtros);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard">
          <ArrowLeft />
          Volver al panel
        </Link>
      </Button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {proyecto.name}
          </h1>

          {proyecto.description && (
            <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
              {proyecto.description}
            </p>
          )}

          {tareas.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {filtrando
                ? "Ninguna tarea coincide con los filtros."
                : "Todavía no hay tareas."}
            </p>
          ) : (
            <dl className="mt-4 flex gap-8">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {filtrando ? "Tareas encontradas" : "Tareas creadas"}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {tareas.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Completadas</dt>
                <dd className="text-2xl font-semibold tabular-nums">{hechas}</dd>
              </div>
            </dl>
          )}
        </div>

        <TaskDialog proyectoId={proyecto.id} miembros={miembros}>
          <Button>
            <Plus />
            Nueva tarea
          </Button>
        </TaskDialog>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <TaskFilters filtros={filtros} miembros={miembros} />
      </div>

      <TaskBoard
        proyectoId={proyecto.id}
        tareas={tareas}
        miembros={miembros}
        filtrando={filtrando}
      />
    </div>
  );
}
