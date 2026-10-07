import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FolderPlus, Plus } from "lucide-react";

import { ProjectCard } from "@/components/workspace/project-card";
import { ProjectDialog } from "@/components/workspace/project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TeamSummary } from "@/components/workspace/team-summary";
import { obtenerMiembrosDelEquipo } from "@/lib/queries/equipo";
import { obtenerEquipoActual, obtenerProyectos } from "@/lib/queries/workspace";

export const metadata: Metadata = {
  title: "Panel",
};

export default async function DashboardPage() {
  const equipo = await obtenerEquipoActual();

  // Sin equipo no hay nada que enseñar: primero hay que crearlo.
  if (!equipo) {
    redirect("/bienvenida");
  }

  const [proyectos, miembros] = await Promise.all([
    obtenerProyectos(equipo.id),
    obtenerMiembrosDelEquipo(equipo.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {equipo.name}
            </h1>
            <Badge variant={equipo.rol === "admin" ? "default" : "secondary"}>
              {equipo.rol === "admin" ? "Admin" : "Miembro"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {proyectos.length === 0
              ? "Aún no hay proyectos en este equipo."
              : `${proyectos.length} ${proyectos.length === 1 ? "proyecto" : "proyectos"} en marcha.`}
          </p>
        </div>

        <ProjectDialog>
          <Button>
            <Plus />
            Nuevo proyecto
          </Button>
        </ProjectDialog>
      </div>

      {proyectos.length > 0 && (
        <div className="mt-8">
          <TeamSummary proyectos={proyectos} miembros={miembros.length} />
        </div>
      )}

      {proyectos.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FolderPlus className="size-5" aria-hidden />
            </span>
            <p className="font-medium">Crea tu primer proyecto</p>
            <p className="max-w-sm text-sm text-pretty text-muted-foreground">
              Un proyecto agrupa el trabajo de una iniciativa y tiene su propio
              tablero de tareas.
            </p>

            <ProjectDialog>
              <Button className="mt-2">
                <Plus />
                Nuevo proyecto
              </Button>
            </ProjectDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proyecto) => (
            <ProjectCard key={proyecto.id} proyecto={proyecto} rol={equipo.rol} />
          ))}
        </div>
      )}
    </div>
  );
}
