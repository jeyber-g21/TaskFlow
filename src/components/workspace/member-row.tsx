"use client";

import { useState, useTransition } from "react";
import { Loader2, MoreHorizontal, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { cambiarRol, expulsarMiembro } from "@/app/(app)/settings/actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MiembroDelEquipo } from "@/lib/queries/equipo";
import { ETIQUETAS_ROL, type MemberRoleValue } from "@/lib/validations/invitation";

const ROLES = Object.entries(ETIQUETAS_ROL) as [MemberRoleValue, string][];

export function MemberRow({
  miembro,
  puedeGestionar,
}: {
  miembro: MiembroDelEquipo;
  puedeGestionar: boolean;
}) {
  const [guardando, iniciarGuardado] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [expulsando, setExpulsando] = useState(false);

  function alCambiarRol(rol: string) {
    iniciarGuardado(async () => {
      const resultado = await cambiarRol(miembro.membershipId, rol as MemberRoleValue);

      if (resultado.status === "error") {
        toast.error(resultado.message);
        return;
      }
      toast.success("Rol actualizado");
    });
  }

  async function confirmarExpulsion() {
    setExpulsando(true);
    const resultado = await expulsarMiembro(miembro.membershipId);
    setExpulsando(false);

    if (resultado.status === "error") {
      toast.error(resultado.message);
      return;
    }

    toast.success(`${miembro.nombre} ya no está en el equipo`);
    setConfirmando(false);
  }

  return (
    <>
      <li className="flex flex-wrap items-center gap-3 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {miembro.iniciales}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {miembro.nombre}
            {miembro.esTu && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (tú)
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Desde el{" "}
            {miembro.desde.toLocaleDateString("es", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Nadie se cambia el rol a sí mismo: sería la forma más fácil de
            dejar el equipo sin administradores por accidente. */}
        {puedeGestionar && !miembro.esTu ? (
          <div className="flex items-center gap-2">
            <Select
              value={miembro.rol}
              onValueChange={alCambiarRol}
              disabled={guardando}
            >
              <SelectTrigger
                size="sm"
                className="w-36"
                aria-label={`Rol de ${miembro.nombre}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(([valor, etiqueta]) => (
                  <SelectItem key={valor} value={valor}>
                    {etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal />
                  <span className="sr-only">Acciones sobre {miembro.nombre}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setConfirmando(true)}
                >
                  <UserMinus />
                  Sacar del equipo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Badge variant={miembro.rol === "admin" ? "default" : "secondary"}>
            {ETIQUETAS_ROL[miembro.rol]}
          </Badge>
        )}
      </li>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Sacar a {miembro.nombre} del equipo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de ver los proyectos y las tareas. Las tareas que tuviera
              asignadas se quedan sin responsable, no se borran.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={expulsando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(evento) => {
                evento.preventDefault();
                void confirmarExpulsion();
              }}
              disabled={expulsando}
            >
              {expulsando && <Loader2 className="animate-spin" />}
              Sacar del equipo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
