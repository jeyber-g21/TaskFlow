"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { borrarTarea, moverTarea } from "@/app/(app)/projects/[id]/actions";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Responsable, TareaConResponsable } from "@/lib/queries/tasks";
import {
  COLUMNAS,
  ESTILOS_PRIORIDAD,
  ETIQUETAS_PRIORIDAD,
} from "@/lib/validations/task";

export function TaskCard({
  tarea,
  proyectoId,
  miembros,
}: {
  tarea: TareaConResponsable;
  proyectoId: string;
  miembros: Responsable[];
}) {
  const [editando, setEditando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [moviendo, iniciarMovimiento] = useTransition();
  const [borrando, setBorrando] = useState(false);

  const indiceActual = COLUMNAS.findIndex((c) => c.estado === tarea.estado);
  const anterior = COLUMNAS[indiceActual - 1];
  const siguiente = COLUMNAS[indiceActual + 1];

  function mover(estado: (typeof COLUMNAS)[number]["estado"]) {
    iniciarMovimiento(async () => {
      const resultado = await moverTarea(proyectoId, tarea.id, estado);
      if (resultado.status === "error") toast.error(resultado.message);
    });
  }

  async function confirmarBorrado() {
    setBorrando(true);
    const resultado = await borrarTarea(proyectoId, tarea.id);
    setBorrando(false);

    if (resultado.status === "error") {
      toast.error(resultado.message);
      return;
    }

    toast.success("Tarea eliminada");
    setConfirmandoBorrado(false);
  }

  return (
    <>
      <article
        className={`tarjeta-viva rounded-lg border border-border bg-card p-3 shadow-xs ${
          moviendo ? "opacity-50" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm leading-snug font-medium text-pretty">
            {tarea.title}
          </h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mt-1 -mr-1.5 size-7 shrink-0"
                disabled={moviendo}
              >
                <MoreHorizontal />
                <span className="sr-only">Acciones de {tarea.title}</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {/* Mover con el menú, no arrastrando: funciona con teclado y en
                  móvil, donde el arrastre es incómodo. */}
              {anterior && (
                <DropdownMenuItem onSelect={() => mover(anterior.estado)}>
                  <ArrowLeft />
                  Mover a {anterior.titulo}
                </DropdownMenuItem>
              )}
              {siguiente && (
                <DropdownMenuItem onSelect={() => mover(siguiente.estado)}>
                  <ArrowRight />
                  Mover a {siguiente.titulo}
                </DropdownMenuItem>
              )}

              {(anterior || siguiente) && <DropdownMenuSeparator />}

              <DropdownMenuItem onSelect={() => setEditando(true)}>
                <Pencil />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmandoBorrado(true)}
              >
                <Trash2 />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {tarea.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-pretty text-muted-foreground">
            {tarea.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${ESTILOS_PRIORIDAD[tarea.prioridad]}`}
          >
            {ETIQUETAS_PRIORIDAD[tarea.prioridad]}
          </span>

          {tarea.responsable ? (
            <span
              title={tarea.responsable.nombre}
              className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary"
            >
              {tarea.responsable.iniciales}
              <span className="sr-only">
                Responsable: {tarea.responsable.nombre}
              </span>
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Sin asignar</span>
          )}
        </div>
      </article>

      <TaskDialog
        proyectoId={proyectoId}
        tarea={tarea}
        miembros={miembros}
        abierto={editando}
        onAbiertoChange={setEditando}
      />

      <AlertDialog open={confirmandoBorrado} onOpenChange={setConfirmandoBorrado}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{tarea.title}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={borrando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(evento) => {
                // Sin esto el diálogo se cierra antes de terminar y no se
                // llegaría a ver el error si algo falla.
                evento.preventDefault();
                void confirmarBorrado();
              }}
              disabled={borrando}
            >
              {borrando && <Loader2 className="animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
