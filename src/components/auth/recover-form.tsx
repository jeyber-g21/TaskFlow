"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";

import { pedirRecuperacion } from "@/app/(auth)/actions";
import { FieldError } from "@/components/auth/field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolverZod } from "@/lib/validations/resolver";
import { recuperarSchema, type RecuperarInput } from "@/lib/validations/auth";

export function RecoverForm() {
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarInput>({
    resolver: resolverZod(recuperarSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RecuperarInput) {
    setErrorServidor(null);

    const resultado = await pedirRecuperacion(values);

    if (resultado.status === "error") {
      setErrorServidor(resultado.message);
      return;
    }
    setAviso(resultado.message);
  }

  if (aviso) {
    return (
      <Alert>
        <MailCheck />
        <AlertTitle>Revisa tu correo</AlertTitle>
        <AlertDescription>{aviso}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errorServidor && (
        <Alert variant="destructive">
          <AlertDescription>{errorServidor}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="tu@email.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
