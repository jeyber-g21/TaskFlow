import "server-only";

import { analisisRestantes } from "@/lib/analisis/limite";
import { createClient } from "@/lib/supabase/server";

/**
 * Análisis que le quedan al equipo en las últimas 24 horas.
 *
 * Solo para mostrarlo: quien hace cumplir el límite es Postgres, al reservar.
 * Si la consulta falla, se muestra el cupo entero; en el peor caso la
 * reserva lo rechaza después con un mensaje claro.
 */
export async function obtenerAnalisisRestantes(equipoId: string): Promise<number> {
  const supabase = await createClient();
  const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("board_analyses")
    .select("id", { count: "exact", head: true })
    .eq("team_id", equipoId)
    .gt("created_at", hace24Horas);

  return analisisRestantes(count ?? 0);
}
