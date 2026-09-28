"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Check, Copy, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { crearInvitacion } from "@/app/(app)/settings/actions";
import { FieldError } from "@/components/auth/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enlaceDeInvitacion } from "@/lib/invitaciones";
import { resolverZod } from "@/lib/validations/resolver";
import {
  DESCRIPCIONES_ROL,
  DIAS_DE_VALIDEZ,
  ETIQUETAS_ROL,
  invitationSchema,
  type InvitationInput,
} from "@/lib/validations/invitation";

const ROLES = Object.entries(ETIQUETAS_ROL) as [
  keyof typeof ETIQUETAS_ROL,
  string,
][];

export function InviteForm() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enlaceRecien, setEnlaceRecien] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvitationInput>({
    resolver: resolverZod(invitationSchema),
    defaultValues: { email: "", role: "member" },
  });

  async function onSubmit(values: InvitationInput) {
    setErrorServidor(null);
    setEnlaceRecien(null);

    const resultado = await crearInvitacion(values);

    if (resultado.status === "error") {
      setErrorServidor(resultado.message);
      return;
    }

    if (resultado.token) {
      setEnlaceRecien(enlaceDeInvitacion(window.location.origin, resultado.token));
    }

    toast.success("Invitación creada");
    reset({ email: "", role: "member" });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errorServidor && (
          <Alert variant="destructive">
            <AlertDescription>{errorServidor}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email de quien invitas</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="companero@ejemplo.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Rol</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="invite-role" className="w-full">
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
              )}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {DESCRIPCIONES_ROL.member} Los administradores, además, gestionan el
          equipo.
        </p>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
          Generar invitación
        </Button>
      </form>

      {enlaceRecien && <EnlaceGenerado enlace={enlaceRecien} />}
    </div>
  );
}

function EnlaceGenerado({ enlace }: { enlace: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // El portapapeles falla en contextos no seguros o si se deniega el
      // permiso. El enlace está a la vista para copiarlo a mano.
      toast.error("No hemos podido copiarlo. Selecciónalo y cópialo a mano.");
    }
  }

  return (
    <Alert>
      <AlertDescription className="space-y-3">
        <p className="text-foreground">
          Compártelo con esa persona. También le aparecerá al entrar en
          TaskFlow con ese email, sin necesidad del enlace.
        </p>
        <p className="text-xs">
          Caduca en {DIAS_DE_VALIDEZ} días y solo sirve una vez.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs">
            {enlace}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={copiar}>
            {copiado ? <Check /> : <Copy />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
