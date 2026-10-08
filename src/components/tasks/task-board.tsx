import { Plus } from "lucide-react";

import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Button } from "@/components/ui/button";
import type { Responsable, TareaConResponsable } from "@/lib/queries/tasks";
import { COLUMNAS } from "@/lib/validations/task";

const ESTILO_COLUMNA: Record<string, { punto: string; cabecera: string }> = {
  todo: { punto: "bg-muted-foreground/50", cabecera: "columna-todo" },
  in_progress: { punto: "bg-primary", cabecera: "columna-progreso" },
  done: { punto: "bg-emerald-500", cabecera: "columna-hecho" },
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
  filtrando = false,
}: {
  proyectoId: string;
  tareas: TareaConResponsable[];
  miembros: Responsable[];
  filtrando?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNAS.map((columna) => {
        const deLaColumna = tareas.filter((t) => t.estado === columna.estado);

        return (
          <section
            key={columna.estado}
            aria-label={columna.titulo}
            className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card/40"
          >
            <header
              className={`flex items-center gap-2 border-b border-border/60 px-3 py-2.5 ${ESTILO_COLUMNA[columna.estado].cabecera}`}
            >
              <span
                className={`size-2 rounded-full ${ESTILO_COLUMNA[columna.estado].punto}`}
              />
              <h2 className="text-sm font-medium">{columna.titulo}</h2>
              <span className="ml-auto rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium tabular-nums">
                {deLaColumna.length}
              </span>
            </header>

            <div className="flex flex-col gap-2 p-3">
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
                  {filtrando ? "Nada que coincida" : "Nada por aquí"}
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
                className="mx-3 mb-3 w-auto justify-start text-muted-foreground"
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
