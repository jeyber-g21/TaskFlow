import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Se ve tanto al escribir una dirección que no existe como al pedir algo de
 * otro equipo: la base de datos no devuelve la fila y la aplicación no
 * distingue entre "no existe" y "no es tuyo". Es deliberado: decir "existe
 * pero no puedes verlo" ya es contar de más.
 */
export default function NoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-6" aria-hidden />
      </span>

      <h1 className="text-2xl font-semibold tracking-tight">
        Aquí no hay nada
      </h1>
      <p className="max-w-sm text-pretty text-muted-foreground">
        La página que buscas no existe, o pertenece a un equipo del que no
        formas parte.
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">Ir a mi panel</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </main>
  );
}
