"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { cambiarContrasena } from "@/app/(auth)/actions";
import { FieldError } from "@/components/auth/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { esErrorDeRedireccion } from "@/lib/errors";
import { resolverZod } from "@/lib/validations/resolver";
import {
  nuevaContrasenaSchema,
  type NuevaContrasenaInput,
} from "@/lib/validations/auth";

export function NewPasswordForm() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NuevaContrasenaInput>({
    resolver: resolverZod(nuevaContrasenaSchema),
    defaultValues: { password: "", repetir: "" },
  });

  async function onSubmit(values: NuevaContrasenaInput) {
    setErrorServidor(null);

    try {
      const resultado = await cambiarContrasena(values);
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
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={Boolean(errors.password)}
          aria-describedby="password-ayuda"
          {...register("password")}
        />
        <p id="password-ayuda" className="text-xs text-muted-foreground">
          Mínimo 8 caracteres.
        </p>
        <FieldError message={errors.password?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="repetir">Repítela</Label>
        <Input
          id="repetir"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.repetir)}
          {...register("repetir")}
        />
        <FieldError message={errors.repetir?.message} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
