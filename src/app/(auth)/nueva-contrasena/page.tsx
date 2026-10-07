import type { Metadata } from "next";
import Link from "next/link";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

export default async function NuevaContrasenaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Aquí se llega desde el enlace del correo, que deja la sesión abierta al
  // pasar por /auth/callback. Sin sesión, el enlace caducó o nunca existió.
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>El enlace ya no vale</CardTitle>
          <CardDescription>
            Los enlaces para cambiar la contraseña caducan al poco tiempo y solo
            sirven una vez. Pide uno nuevo.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/recuperar">Pedir otro enlace</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elige una contraseña nueva</CardTitle>
        <CardDescription>
          La usarás para entrar a partir de ahora.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <NewPasswordForm />
      </CardContent>
    </Card>
  );
}
