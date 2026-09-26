"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { crearEquipo } from "@/app/(app)/actions";
import { FieldError } from "@/components/auth/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { esErrorDeRedireccion } from "@/lib/errors";
import { resolverZod } from "@/lib/validations/resolver";
import { teamSchema, type TeamInput } from "@/lib/validations/workspace";

export function TeamForm({ sugerencia }: { sugerencia: string }) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamInput>({
    resolver: resolverZod(teamSchema),
    defaultValues: { name: sugerencia },
  });

  async function onSubmit(values: TeamInput) {
    setErrorServidor(null);

    try {
      const resultado = await crearEquipo(values);
      if (resultado?.status === "error") setErrorServidor(resultado.message);
    } catch (error) {
      if (esErrorDeRedireccion(error)) throw error;
      setErrorServidor("No hemos podido conectar. Inténtalo de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errorServidor && (
        <Alert variant="destructive">
          <AlertDescription>{errorServidor}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del equipo</Label>
        <Input
          id="name"
          autoFocus
          autoComplete="organization"
          placeholder="Equipo de Producto"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
        <p className="text-xs text-muted-foreground">
          Podrás cambiarlo más adelante.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Creando equipo…" : "Crear equipo"}
      </Button>
    </form>
  );
}
