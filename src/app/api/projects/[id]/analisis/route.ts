import Anthropic from "@anthropic-ai/sdk";

import {
  CABECERA_RESTANTES,
  CODIGO_LIMITE_ALCANZADO,
  LIMITE_DIARIO_ANALISIS,
} from "@/lib/analisis/limite";
import { INSTRUCCIONES, describirTablero } from "@/lib/analisis/prompt";
import { obtenerMiembros, obtenerTareas } from "@/lib/queries/tasks";
import { createClient } from "@/lib/supabase/server";

/**
 * Analiza el tablero de un proyecto con Claude y devuelve el texto según se
 * genera, para que se vea escribir en lugar de esperar con un spinner.
 *
 * Es una ruta y no una Server Action porque las acciones devuelven la
 * respuesta entera de una vez: aquí lo que se quiere es un stream.
 */

// Haiku: el análisis de un tablero es un resumen corto, y en una demo pública
// cada petición la paga el dueño del proyecto.
const MODELO = "claude-haiku-5-5";

// Un análisis tarda unos segundos; esto es solo el techo por si la API se
// queda colgada, para que la función no siga corriendo (y cobrando).
export const maxDuration = 60;

function fallo(status: number, mensaje: string) {
  return Response.json({ mensaje }, { status });
}

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/projects/[id]/analisis">,
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  // getUser() y no getSession(): valida el token contra Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return fallo(401, "Inicia sesión para analizar el tablero.");
  }

  // Antes de gastar cupo: sin clave no hay análisis posible.
  if (!process.env.ANTHROPIC_API_KEY) {
    return fallo(503, "El análisis con IA todavía está en desarrollo.");
  }

  // RLS solo devuelve el proyecto a quien es de su equipo; para cualquier
  // otro, no existe.
  const { data: proyecto } = await supabase
    .from("projects")
    .select("id, name, description, team_id")
    .eq("id", id)
    .maybeSingle();
  if (!proyecto) {
    return fallo(404, "No encontramos este proyecto.");
  }

  const [tareas, miembros] = await Promise.all([
    obtenerTareas(proyecto.id),
    obtenerMiembros(proyecto.team_id),
  ]);
  if (tareas.length === 0) {
    return fallo(400, "Añade alguna tarea antes de pedir un análisis.");
  }

  // El límite lo aplica Postgres, en la misma operación que apunta el
  // análisis: dos peticiones a la vez no pueden colarse las dos.
  const { data: restantes, error: errorDeReserva } = await supabase.rpc(
    "claim_board_analysis",
    { target_project_id: proyecto.id },
  );
  if (errorDeReserva) {
    if (errorDeReserva.code === CODIGO_LIMITE_ALCANZADO) {
      return fallo(
        429,
        `Tu equipo ya ha usado los ${LIMITE_DIARIO_ANALISIS} análisis de las últimas 24 horas.`,
      );
    }
    if (errorDeReserva.code === "42501") {
      return fallo(404, "No encontramos este proyecto.");
    }
    console.error("[analisis] no se pudo reservar:", errorDeReserva);
    return fallo(500, "No hemos podido iniciar el análisis. Inténtalo de nuevo.");
  }

  const cliente = new Anthropic();
  const stream = cliente.messages.stream({
    model: MODELO,
    max_tokens: 4000,
    // Un resumen no necesita pensar mucho: menos espera y menos coste.
    output_config: { effort: "low" },
    system: INSTRUCCIONES,
    messages: [
      {
        role: "user",
        content: describirTablero({
          proyecto: { nombre: proyecto.name, descripcion: proyecto.description },
          tareas,
          miembros,
          ahora: new Date(),
        }),
      },
    ],
  });

  const codificador = new TextEncoder();
  const cuerpo = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const evento of stream) {
          // Solo el texto: la respuesta puede traer también bloques de
          // razonamiento, que no son para el equipo.
          if (
            evento.type === "content_block_delta" &&
            evento.delta.type === "text_delta"
          ) {
            controller.enqueue(codificador.encode(evento.delta.text));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            codificador.encode("\n\nNo hemos podido completar el análisis de este tablero."),
          );
        }
        controller.close();
      } catch (error) {
        // El estado 200 ya se envió al empezar el stream, así que el fallo se
        // comunica cortándolo; la interfaz lo muestra como error.
        console.error("[analisis] fallo de la API:", error);
        controller.error(error);
      }
    },
    cancel() {
      // Si la persona se va de la página, se deja de generar (y de pagar).
      stream.abort();
    },
  });

  return new Response(cuerpo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      [CABECERA_RESTANTES]: String(restantes),
    },
  });
}
