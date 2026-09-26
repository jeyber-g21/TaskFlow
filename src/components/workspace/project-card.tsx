"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { borrarProyecto } from "@/app/(app)/actions";
import { ProjectDialog } from "@/components/workspace/project-dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProyectoConResumen } from "@/lib/queries/workspace";
import type { MemberRole } from "@/lib/db/schema";

export function ProjectCard({
  proyecto,
  rol,
}: {
  proyecto: ProyectoConResumen;
  rol: MemberRole;
}) {
  const [editando, setEditando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  // Ocultar el botón no es la protección: la política de la base de datos solo
  // deja borrar a los administradores. Esto evita ofrecer algo que fallará.
  const puedeBorrar = rol === "admin";

  const progreso =
    proyecto.tareas > 0
      ? Math.round((proyecto.tareasHechas / proyecto.tareas) * 100)
      : 0;

  async function confirmarBorrado() {
    setBorrando(true);
    const resultado = await borrarProyecto(proyecto.id);
    setBorrando(false);

    if (resultado.status === "error") {
      toast.error(resultado.message);
      return;
    }

    toast.success("Proyecto eliminado");
    setConfirmandoBorrado(false);
  }

  return (
    <>
      <Card className="tarjeta-viva group relative h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base text-pretty">
              {/* El enlace cubre toda la tarjeta, pero el menú queda por
                  encima para que su clic no navegue. */}
              <Link href={`/projects/${proyecto.id}`} className="before:absolute before:inset-0">
                {proyecto.name}
              </Link>
            </CardTitle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative -mt-1 -mr-2 size-8 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <MoreHorizontal />
                  <span className="sr-only">Acciones del proyecto</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditando(true)}>
                  <Pencil />
                  Editar
                </DropdownMenuItem>

                {puedeBorrar && (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setConfirmandoBorrado(true)}
                  >
                    <Trash2 />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {proyecto.description && (
            <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">
              {proyecto.description}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {proyecto.tareas === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tareas todavía</p>
          ) : (
            <div className="space-y-2">
              <dl className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Tareas creadas</dt>
                  <dd className="font-medium tabular-nums">{proyecto.tareas}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Completadas</dt>
                  <dd className="font-medium tabular-nums">
                    {proyecto.tareasHechas}
                  </dd>
                </div>
              </dl>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progreso</span>
                <span className="font-medium tabular-nums">{progreso}%</span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={progreso}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso de ${proyecto.name}`}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary to-acento transition-[width] duration-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        proyecto={proyecto}
        abierto={editando}
        onAbiertoChange={setEditando}
      />

      <AlertDialog open={confirmandoBorrado} onOpenChange={setConfirmandoBorrado}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{proyecto.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              {proyecto.tareas > 0
                ? `Se borrarán también sus ${proyecto.tareas} tareas. Esta acción no se puede deshacer.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={borrando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(evento) => {
                // Sin esto el diálogo se cierra antes de que termine el
                // borrado y no se llega a ver si ha fallado.
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
