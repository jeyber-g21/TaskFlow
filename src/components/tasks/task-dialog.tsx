"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { crearTarea, editarTarea } from "@/app/(app)/projects/[id]/actions";
import { FieldError } from "@/components/auth/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Responsable, TareaConResponsable } from "@/lib/queries/tasks";
import { resolverZod } from "@/lib/validations/resolver";
import {
  COLUMNAS,
  ETIQUETAS_PRIORIDAD,
  taskSchema,
  type TaskInput,
  type TaskStatusValue,
} from "@/lib/validations/task";

const PRIORIDADES = Object.entries(ETIQUETAS_PRIORIDAD) as [
  keyof typeof ETIQUETAS_PRIORIDAD,
  string,
][];

/** Valor del desplegable cuando la tarea no tiene responsable. */
const SIN_RESPONSABLE = "sin-responsable";

function FormularioTarea({
  proyectoId,
  tarea,
  estadoInicial,
  miembros,
  alTerminar,
}: {
  proyectoId: string;
  tarea?: TareaConResponsable;
  estadoInicial: TaskStatusValue;
  miembros: Responsable[];
  alTerminar: () => void;
}) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const editando = Boolean(tarea);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: resolverZod(taskSchema),
    defaultValues: {
      title: tarea?.title ?? "",
      description: tarea?.description ?? "",
      status: tarea?.estado ?? estadoInicial,
      priority: tarea?.prioridad ?? "medium",
      assigneeId: tarea?.responsable?.id ?? null,
    },
  });

  async function onSubmit(values: TaskInput) {
    setErrorServidor(null);

    const resultado = tarea
      ? await editarTarea(proyectoId, tarea.id, values)
      : await crearTarea(proyectoId, values);

    if (resultado.status === "error") {
      setErrorServidor(resultado.message);
      return;
    }

    toast.success(editando ? "Tarea actualizada" : "Tarea creada");
    alTerminar();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errorServidor && (
        <Alert variant="destructive">
          <AlertDescription>{errorServidor}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="task-title">Título</Label>
        <Input
          id="task-title"
          autoFocus
          placeholder="Definir las políticas de permisos"
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">
          Descripción <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="task-description"
          rows={3}
          placeholder="Detalles, criterios de aceptación, enlaces…"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-status">Estado</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNAS.map((columna) => (
                    <SelectItem key={columna.estado} value={columna.estado}>
                      {columna.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-priority">Prioridad</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map(([valor, etiqueta]) => (
                    <SelectItem key={valor} value={valor}>
                      {etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-assignee">Responsable</Label>
        <Controller
          control={control}
          name="assigneeId"
          render={({ field }) => (
            <Select
              // Radix no admite cadena vacía como valor, así que "sin
              // responsable" viaja con su propia etiqueta y se traduce a null.
              value={field.value ?? SIN_RESPONSABLE}
              onValueChange={(valor) =>
                field.onChange(valor === SIN_RESPONSABLE ? null : valor)
              }
            >
              <SelectTrigger id="task-assignee" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_RESPONSABLE}>Sin asignar</SelectItem>
                {miembros.map((miembro) => (
                  <SelectItem key={miembro.id} value={miembro.id}>
                    {miembro.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.assigneeId?.message} />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={alTerminar}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {editando ? "Guardar cambios" : "Crear tarea"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TaskDialog({
  proyectoId,
  tarea,
  estadoInicial = "todo",
  miembros,
  children,
  abierto,
  onAbiertoChange,
}: {
  proyectoId: string;
  tarea?: TareaConResponsable;
  estadoInicial?: TaskStatusValue;
  miembros: Responsable[];
  children?: ReactNode;
  abierto?: boolean;
  onAbiertoChange?: (valor: boolean) => void;
}) {
  const [abiertoInterno, setAbiertoInterno] = useState(false);

  const esControlado = abierto !== undefined;
  const estaAbierto = esControlado ? abierto : abiertoInterno;
  const cambiarApertura = esControlado ? onAbiertoChange! : setAbiertoInterno;

  return (
    <Dialog open={estaAbierto} onOpenChange={cambiarApertura}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tarea ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            {tarea
              ? "Actualiza los datos de la tarea."
              : "Describe qué hay que hacer y quién se encarga."}
          </DialogDescription>
        </DialogHeader>

        <FormularioTarea
          proyectoId={proyectoId}
          tarea={tarea}
          estadoInicial={estadoInicial}
          miembros={miembros}
          alTerminar={() => cambiarApertura(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
