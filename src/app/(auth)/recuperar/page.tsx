import type { Metadata } from "next";
import Link from "next/link";

import { RecoverForm } from "@/components/auth/recover-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function RecuperarPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>¿Olvidaste tu contraseña?</CardTitle>
        <CardDescription>
          Escribe tu email y te enviamos un enlace para elegir una nueva.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <RecoverForm />
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Volver a entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
