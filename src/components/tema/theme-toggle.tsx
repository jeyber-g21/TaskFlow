"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tema = "claro" | "oscuro" | "sistema";

const OPCIONES: { valor: Tema; etiqueta: string; Icono: typeof Sun }[] = [
  { valor: "claro", etiqueta: "Claro", Icono: Sun },
  { valor: "oscuro", etiqueta: "Oscuro", Icono: Moon },
  { valor: "sistema", etiqueta: "Según el sistema", Icono: Monitor },
];

/**
 * El tema elegido vive en localStorage, que es estado externo a React. Se lee
 * con useSyncExternalStore y no con useEffect + useState: así React sabe que
 * el valor puede cambiar por su cuenta y lo trata bien durante la hidratación,
 * sin el parpadeo de un estado inicial que no es el real.
 */
const oyentes = new Set<() => void>();

function suscribir(alCambiar: () => void) {
  oyentes.add(alCambiar);
  // Si se cambia el tema en otra pestaña, esta se entera.
  window.addEventListener("storage", alCambiar);

  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

function leerTema(): Tema {
  try {
    const guardado = localStorage.getItem("tema");
    return guardado === "claro" || guardado === "oscuro" ? guardado : "sistema";
  } catch {
    return "sistema";
  }
}

/** En el servidor no hay preferencia conocida: se asume la del sistema. */
function leerTemaEnServidor(): Tema {
  return "sistema";
}

function aplicar(tema: Tema) {
  const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const oscuro = tema === "oscuro" || (tema === "sistema" && prefiereOscuro);

  document.documentElement.classList.toggle("dark", oscuro);

  try {
    if (tema === "sistema") {
      localStorage.removeItem("tema");
    } else {
      localStorage.setItem("tema", tema);
    }
  } catch {
    // Sin almacenamiento el cambio vale solo para esta pestaña. Es peor no
    // dejar cambiarlo que no poder recordarlo.
  }

  oyentes.forEach((alCambiar) => alCambiar());
}

export function ThemeToggle() {
  const tema = useSyncExternalStore(suscribir, leerTema, leerTemaEnServidor);

  // Con el tema "según el sistema" hay que seguir al sistema de verdad: mucha
  // gente lo tiene programado para cambiar por la tarde.
  useEffect(() => {
    if (tema !== "sistema") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = () => aplicar("sistema");

    media.addEventListener("change", alCambiar);
    return () => media.removeEventListener("change", alCambiar);
  }, [tema]);

  const Actual = OPCIONES.find((opcion) => opcion.valor === tema)?.Icono ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9">
          <Actual />
          <span className="sr-only">Cambiar tema (ahora: {tema})</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {OPCIONES.map(({ valor, etiqueta, Icono }) => (
          <DropdownMenuItem
            key={valor}
            onSelect={() => aplicar(valor)}
            className={tema === valor ? "bg-accent" : undefined}
          >
            <Icono />
            {etiqueta}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
