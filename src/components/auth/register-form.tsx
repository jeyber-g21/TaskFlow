"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";

import { signUp } from "@/app/(auth)/actions";
import { FieldError } from "@/components/auth/field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { esErrorDeRedireccion } from "@/lib/errors";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [avisoConfirmacion, setAvisoConfirmacion] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setErrorServidor(null);

    try {
      const resultado = await signUp(values);

      if (resultado?.status === "error") {
        setErrorServidor(resultado.message);
        return;
      }
      // La cuenta se creó pero hay que confirmar el email antes de entrar.
      if (resultado?.status === "success") {
        setAvisoConfirmacion(resultado.message);
      }
    } catch (error) {
      if (esErrorDeRedireccion(error)) throw error;
      setErrorServidor(
        "No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo.",
      );
    }
  }

  if (avisoConfirmacion) {
    return (
      <Alert>
        <MailCheck />
        <AlertTitle>Revisa tu correo</AlertTitle>
        <AlertDescription>{avisoConfirmacion}</AlertDescription>
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
        <Label htmlFor="fullName">Nombre</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Jeyber Gómez"
          aria-invalid={Boolean(errors.fullName)}
          {...register("fullName")}
        />
        <FieldError message={errors.fullName?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby="password-ayuda"
          {...register("password")}
        />
        <p id="password-ayuda" className="text-xs text-muted-foreground">
          Mínimo 8 caracteres.
        </p>
        <FieldError message={errors.password?.message} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
