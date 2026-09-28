"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { revocarInvitacion } from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { enlaceDeInvitacion } from "@/lib/invitaciones";
import type { InvitacionPendiente } from "@/lib/queries/equipo";
import { ETIQUETAS_ROL } from "@/lib/validations/invitation";

export function InvitationRow({
  invitacion,
}: {
  invitacion: InvitacionPendiente;
}) {
  const [copiado, setCopiado] = useState(false);
  const [revocando, setRevocando] = useState(false);

  async function copiar() {
    // El origen se lee en el navegador: en local es localhost y en la demo el
    // dominio real, sin tener que configurarlo en ningún sitio.
    const enlace = enlaceDeInvitacion(window.location.origin, invitacion.token);

    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No hemos podido copiar el enlace.");
    }
  }

  async function revocar() {
    setRevocando(true);
    const resultado = await revocarInvitacion(invitacion.id);
    setRevocando(false);

    if (resultado.status === "error") {
      toast.error(resultado.message);
      return;
    }
    toast.success("Invitación revocada");
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{invitacion.email}</p>
        <p className="text-xs text-muted-foreground">
          Caduca el{" "}
          {invitacion.caducaEl.toLocaleDateString("es", {
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <Badge variant={invitacion.rol === "admin" ? "default" : "secondary"}>
        {ETIQUETAS_ROL[invitacion.rol]}
      </Badge>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={copiar}>
          {copiado ? <Check /> : <Copy />}
          <span className="sr-only sm:not-sr-only">
            {copiado ? "Copiado" : "Copiar enlace"}
          </span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={revocar}
          disabled={revocando}
        >
          {revocando ? <Loader2 className="animate-spin" /> : <Trash2 />}
          <span className="sr-only">Revocar invitación de {invitacion.email}</span>
        </Button>
      </div>
    </li>
  );
}
