import { CheckCircle2, FolderKanban, ListTodo, Users } from "lucide-react";

import type { ProyectoConResumen } from "@/lib/queries/workspace";

/**
 * Resumen del equipo en cuatro cifras.
 *
 * Se calcula a partir de los proyectos que ya se consultaron para pintar la
 * rejilla, así que no cuesta ninguna consulta extra.
 */
export function TeamSummary({
  proyectos,
  miembros,
}: {
  proyectos: ProyectoConResumen[];
  miembros: number;
}) {
  const tareas = proyectos.reduce((total, p) => total + p.tareas, 0);
  const hechas = proyectos.reduce((total, p) => total + p.tareasHechas, 0);

  const CIFRAS = [
    {
      etiqueta: "Proyectos",
      valor: proyectos.length,
      Icono: FolderKanban,
      tinte: "bg-primary/10 text-primary",
    },
    {
      etiqueta: "Tareas",
      valor: tareas,
      Icono: ListTodo,
      tinte: "bg-acento/10 text-acento",
    },
    {
      etiqueta: "Completadas",
      valor: hechas,
      Icono: CheckCircle2,
      tinte: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      etiqueta: miembros === 1 ? "Miembro" : "Miembros",
      valor: miembros,
      Icono: Users,
      tinte: "bg-acento-2/15 text-acento-2",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CIFRAS.map(({ etiqueta, valor, Icono, tinte }) => (
        <div
          key={etiqueta}
          className="rounded-xl border border-border bg-card p-4 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex size-7 items-center justify-center rounded-md ${tinte}`}
            >
              <Icono className="size-3.5" aria-hidden />
            </span>
            <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
          </div>
          <dd className="mt-2 text-2xl font-semibold tabular-nums">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
