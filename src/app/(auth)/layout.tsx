import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/tema/theme-toggle";

/**
 * Pantalla partida: el formulario a un lado y una imagen al otro.
 *
 * En móvil la imagen desaparece. No es un recorte: en una pantalla pequeña el
 * formulario necesita todo el espacio, y una imagen decorativa encima solo
 * obligaría a desplazarse para llegar a lo que se viene a hacer.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="flex items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo />
            <span className="text-base font-semibold tracking-tight">
              TaskFlow
            </span>
          </Link>

          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>

      {/* El panel visual se oculta por debajo de 1024px. */}
      <aside className="relative hidden lg:block lg:w-1/2">
        <Image
          src="/organizar.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />

        {/* Velo de marca: tiñe la foto con los colores de TaskFlow para que no
            parezca pegada de otro sitio, y da contraste suficiente al texto. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-br from-primary/85 via-primary/70 to-acento/80 mix-blend-multiply"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <blockquote className="max-w-md">
            <p className="text-2xl font-semibold text-balance text-white xl:text-3xl">
              Todo el trabajo del equipo en un solo sitio
            </p>
            <p className="mt-3 text-pretty text-white/80">
              Proyectos, tareas y responsables, sin perder media mañana
              buscando en qué quedó aquello.
            </p>
          </blockquote>
        </div>
      </aside>
    </div>
  );
}
