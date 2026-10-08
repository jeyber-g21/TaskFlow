"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

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
import type { Responsable } from "@/lib/queries/tasks";
import {
  SIN_RESPONSABLE,
  TODOS,
  hayFiltrosActivos,
  type Filtros,
} from "@/lib/validations/filtros";
import { ETIQUETAS_PRIORIDAD } from "@/lib/validations/task";

const PRIORIDADES = Object.entries(ETIQUETAS_PRIORIDAD) as [string, string][];

/** Tiempo de espera antes de buscar mientras se escribe. */
const ESPERA_ESCRITURA = 350;

export function TaskFilters({
  filtros,
  miembros,
}: {
  filtros: Filtros;
  miembros: Responsable[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [cargando, iniciarCarga] = useTransition();

  // El texto se lleva aparte porque se escribe letra a letra: la URL solo se
  // actualiza cuando se para de teclear.
  const [texto, setTexto] = useState(filtros.q);

  function navegarCon(cambios: Partial<Filtros>) {
    const siguientes = { ...filtros, ...cambios };
    const params = new URLSearchParams();

    if (siguientes.q) params.set("q", siguientes.q);
    if (siguientes.prioridad !== TODOS) params.set("prioridad", siguientes.prioridad);
    if (siguientes.responsable !== TODOS) {
      params.set("responsable", siguientes.responsable);
    }

    const consulta = params.toString();

    iniciarCarga(() => {
      // `scroll: false` evita que el tablero salte arriba al filtrar.
      router.replace(consulta ? `${pathname}?${consulta}` : pathname, {
        scroll: false,
      });
    });
  }

  // Esperar a que deje de escribir evita una consulta por cada tecla.
  useEffect(() => {
    if (texto === filtros.q) return;

    const temporizador = setTimeout(() => navegarCon({ q: texto }), ESPERA_ESCRITURA);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const activos = hayFiltrosActivos(filtros);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1 space-y-1.5">
        <Label htmlFor="buscar-tarea" className="text-xs text-muted-foreground">
          Buscar
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="buscar-tarea"
            aria-label="Buscar tareas"
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Título o descripción"
            className="pl-9"
          />
          {cargando && (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filtro-prioridad" className="text-xs text-muted-foreground">
          Prioridad
        </Label>
        <Select
          value={filtros.prioridad}
          onValueChange={(valor) => navegarCon({ prioridad: valor as Filtros["prioridad"] })}
        >
          <SelectTrigger
            id="filtro-prioridad"
            aria-label="Filtrar por prioridad"
            className="w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas</SelectItem>
            {PRIORIDADES.map(([valor, etiqueta]) => (
              <SelectItem key={valor} value={valor}>
                {etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filtro-responsable" className="text-xs text-muted-foreground">
          Responsable
        </Label>
        <Select
          value={filtros.responsable}
          onValueChange={(valor) => navegarCon({ responsable: valor })}
        >
          <SelectTrigger
            id="filtro-responsable"
            aria-label="Filtrar por responsable"
            className="w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Cualquiera</SelectItem>
            <SelectItem value={SIN_RESPONSABLE}>Sin asignar</SelectItem>
            {miembros.map((miembro) => (
              <SelectItem key={miembro.id} value={miembro.id}>
                {miembro.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activos && (
        <Button
          variant="ghost"
          onClick={() => {
            setTexto("");
            navegarCon({ q: "", prioridad: TODOS, responsable: TODOS });
          }}
        >
          <X />
          Quitar filtros
        </Button>
      )}
    </div>
  );
}
