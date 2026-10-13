"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { interpretarAnalisis, type Bloque } from "@/lib/analisis/formato";
import {
  CABECERA_RESTANTES,
  LIMITE_DIARIO_ANALISIS,
} from "@/lib/analisis/limite";

type Estado = "inactivo" | "esperando" | "escribiendo" | "listo" | "error";

function agrupar(bloques: Bloque[]) {
  // Los puntos seguidos van en una misma lista, para que se lean como tal.
  const grupos: (Bloque | { tipo: "lista"; puntos: string[] })[] = [];
  for (const bloque of bloques) {
    const ultimo = grupos.at(-1);
    if (bloque.tipo === "punto") {
      if (ultimo?.tipo === "lista") ultimo.puntos.push(bloque.texto);
      else grupos.push({ tipo: "lista", puntos: [bloque.texto] });
    } else {
      grupos.push(bloque);
    }
  }
  return grupos;
}

export function BoardAnalysis({
  proyectoId,
  restantes: restantesIniciales,
  configurado,
  hayTareas,
}: {
  proyectoId: string;
  restantes: number;
  configurado: boolean;
  hayTareas: boolean;
}) {
  const [estado, setEstado] = useState<Estado>("inactivo");
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [restantes, setRestantes] = useState(restantesIniciales);
  const cancelar = useRef<AbortController | null>(null);

  // Si se sale de la página a mitad, se corta la petición: el servidor deja
  // entonces de generar texto que ya nadie va a leer.
  useEffect(() => () => cancelar.current?.abort(), []);

  const trabajando = estado === "esperando" || estado === "escribiendo";
  const sinCupo = restantes <= 0;

  async function analizar() {
    cancelar.current?.abort();
    const controlador = new AbortController();
    cancelar.current = controlador;

    setEstado("esperando");
    setTexto("");
    setError(null);

    try {
      const respuesta = await fetch(`/api/projects/${proyectoId}/analisis`, {
        method: "POST",
        signal: controlador.signal,
      });

      if (!respuesta.ok || !respuesta.body) {
        const datos = (await respuesta.json().catch(() => null)) as
          | { mensaje?: string }
          | null;
        if (respuesta.status === 429) setRestantes(0);
        throw new Error(datos?.mensaje ?? "No hemos podido analizar el tablero.");
      }

      const cabecera = Number(respuesta.headers.get(CABECERA_RESTANTES));
      if (Number.isFinite(cabecera)) setRestantes(cabecera);

      const lector = respuesta.body.getReader();
      const decodificador = new TextDecoder();
      setEstado("escribiendo");

      while (true) {
        const { value, done } = await lector.read();
        if (done) break;
        setTexto((previo) => previo + decodificador.decode(value, { stream: true }));
      }

      setEstado("listo");
    } catch (causa) {
      if (controlador.signal.aborted) return;
      setError(
        causa instanceof Error && causa.message !== "Failed to fetch"
          ? causa.message
          : "Se cortó la conexión con el análisis. Inténtalo de nuevo.",
      );
      setEstado("error");
    }
  }

  const grupos = agrupar(interpretarAnalisis(texto));
  const hayResultado = texto.length > 0;

  let aviso: string | null = null;
  if (!configurado) {
    aviso = "El análisis con IA no está activo en este entorno: falta la clave de la API de Anthropic.";
  } else if (!hayTareas) {
    aviso = "Añade alguna tarea y podrás pedir un análisis del tablero.";
  }

  return (
    <section
      aria-labelledby="analisis-titulo"
      className="mb-6 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <h2 id="analisis-titulo" className="text-sm font-medium">
              Análisis con IA
            </h2>
            <p className="text-xs text-muted-foreground text-pretty">
              {aviso ??
                `Claude lee el tablero completo y te dice cómo va, qué riesgos ve y qué haría después. ${
                  sinCupo
                    ? "Tu equipo ha agotado los análisis de las últimas 24 horas."
                    : `Quedan ${restantes} de ${LIMITE_DIARIO_ANALISIS} en las últimas 24 horas.`
                }`}
            </p>
          </div>
        </div>

        {!aviso && (
          <Button
            variant={hayResultado ? "outline" : "default"}
            size="sm"
            onClick={analizar}
            disabled={trabajando || sinCupo}
          >
            {trabajando ? (
              <Loader2 className="animate-spin" />
            ) : hayResultado ? (
              <RotateCcw />
            ) : (
              <Sparkles />
            )}
            {trabajando
              ? "Analizando…"
              : hayResultado
                ? "Volver a analizar"
                : "Analizar tablero"}
          </Button>
        )}
      </div>

      {/* aria-busy evita que el lector de pantalla lea el texto a trozos:
          lo anuncia cuando termina de llegar. */}
      <div aria-live="polite" aria-busy={trabajando}>
        {estado === "esperando" && (
          <p className="mt-4 text-sm text-muted-foreground">Leyendo el tablero…</p>
        )}

        {hayResultado && (
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm leading-relaxed">
            {grupos.map((grupo, i) => {
              if (grupo.tipo === "titulo") {
                return (
                  <h3 key={i} className="pt-2 font-medium first:pt-0">
                    {grupo.texto}
                  </h3>
                );
              }
              if (grupo.tipo === "lista") {
                return (
                  <ul key={i} className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {grupo.puntos.map((punto, j) => (
                      <li key={j}>{punto}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="text-muted-foreground text-pretty">
                  {grupo.texto}
                </p>
              );
            })}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
