import { Plus } from "lucide-react";

import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Button } from "@/components/ui/button";
import type { Responsable, TareaConResponsable } from "@/lib/queries/tasks";
import { COLUMNAS } from "@/lib/validations/task";

const PUNTO_COLUMNA: Record<string, string> = {
  todo: "bg-muted-foreground/50",
  in_progress: "bg-primary",
  done: "bg-emerald-500",
};

/**
 * El tablero es un componente de servidor: solo reparte las tareas en sus
 * columnas. Lo interactivo vive en cada tarjeta, así no se manda al navegador
 * más JavaScript del necesario.
 */
export function TaskBoard({
  proyectoId,
  tareas,
  miembros,
}: {
  proyectoId: string;
  tareas: TareaConResponsable[];
  miembros: Responsable[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNAS.map((columna) => {
        const deLaColumna = tareas.filter((t) => t.estado === columna.estado);

        return (
          <section
            key={columna.estado}
            aria-label={columna.titulo}
            className="flex flex-col rounded-xl bg-muted/40 p-3"
          >
            <header className="mb-3 flex items-center gap-2 px-0.5">
              <span
                className={`size-2 rounded-full ${PUNTO_COLUMNA[columna.estado]}`}
              />
              <h2 className="text-sm font-medium">{columna.titulo}</h2>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {deLaColumna.length}
              </span>
            </header>

            <div className="flex flex-col gap-2">
              {deLaColumna.map((tarea) => (
                <TaskCard
                  key={tarea.id}
                  tarea={tarea}
                  proyectoId={proyectoId}
                  miembros={miembros}
                />
              ))}

              {deLaColumna.length === 0 && (
                <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                  Nada por aquí
                </p>
              )}
            </div>

            {/* Cada columna crea tareas ya en su estado: es lo que espera
                quien piensa "esto está en progreso" y va a esa columna. */}
            <TaskDialog
              proyectoId={proyectoId}
              estadoInicial={columna.estado}
              miembros={miembros}
            >
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start text-muted-foreground"
              >
                <Plus />
                Añadir tarea
              </Button>
            </TaskDialog>
          </section>
        );
      })}
    </div>
  );
}
