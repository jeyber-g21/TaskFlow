const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
} as const;

const PRIORITY_LABELS = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
} as const;

type Priority = keyof typeof PRIORITY_STYLES;

type PreviewTask = {
  title: string;
  priority: Priority;
  assignee: string;
};

type PreviewColumn = {
  name: string;
  dotClass: string;
  tasks: PreviewTask[];
};

const COLUMNS: PreviewColumn[] = [
  {
    name: "Por hacer",
    dotClass: "bg-muted-foreground/50",
    tasks: [
      { title: "Definir políticas RLS por equipo", priority: "high", assignee: "JG" },
      { title: "Diseñar el modal de detalle de tarea", priority: "medium", assignee: "AM" },
      { title: "Revisar textos de la landing", priority: "low", assignee: "LR" },
    ],
  },
  {
    name: "En progreso",
    dotClass: "bg-primary",
    tasks: [
      { title: "CRUD de proyectos del equipo", priority: "high", assignee: "JG" },
      { title: "Invitaciones por email", priority: "medium", assignee: "AM" },
    ],
  },
  {
    name: "Hecho",
    dotClass: "bg-emerald-500",
    tasks: [
      { title: "Registro e inicio de sesión", priority: "high", assignee: "JG" },
      { title: "Deploy automático en Vercel", priority: "medium", assignee: "LR" },
    ],
  },
];

export function BoardPreview() {
  return (
    <div
      role="img"
      aria-label="Vista previa del tablero Kanban de TaskFlow con las columnas Por hacer, En progreso y Hecho"
      className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4"
    >
      <div className="mb-3 flex items-center gap-1.5 px-1">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-xs text-muted-foreground">
          Rediseño del onboarding · Equipo Producto
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {COLUMNS.map((column) => (
          <div key={column.name} className="rounded-lg bg-muted/40 p-2.5">
            <div className="mb-2.5 flex items-center gap-2 px-0.5">
              <span className={`size-2 rounded-full ${column.dotClass}`} />
              <span className="text-xs font-medium">{column.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {column.tasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {column.tasks.map((task) => (
                <div
                  key={task.title}
                  className="rounded-md border border-border/70 bg-background p-2.5 shadow-xs"
                >
                  <p className="text-xs leading-snug font-medium">{task.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                      {task.assignee}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
