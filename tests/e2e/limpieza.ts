import postgres from "postgres";

import { DOMINIO_PRUEBAS, PREFIJO } from "./ejecucion";
import { cargarEntornoLocal } from "../integration/entorno";

/**
 * Los tests registran cuentas de verdad contra Supabase. Sin esto, cada
 * ejecución dejaría usuarios sueltos hasta llenar el proyecto de basura.
 */
export default async function limpiarUsuariosDePrueba() {
  cargarEntornoLocal();

  const url = process.env.DIRECT_URL;
  if (!url) {
    console.warn("[limpieza] falta DIRECT_URL: los usuarios de prueba se quedan.");
    return;
  }

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    // Solo los de esta ejecución: otra puede estar corriendo a la vez contra
    // la misma base de datos, y borrarle los usuarios a mitad de camino
    // produce fallos que parecen aleatorios.
    const borrados = await sql`
      delete from auth.users
      where email like ${PREFIJO + "-%@" + DOMINIO_PRUEBAS}
      returning email
    `;

    // Restos de ejecuciones que se cortaron por la mitad. Un día de margen
    // basta para no tocar ninguna que siga en marcha.
    await sql`
      delete from auth.users
      where email like ${"e2e-%@" + DOMINIO_PRUEBAS}
        and created_at < now() - interval '1 day'
    `;
    await sql`
      delete from public.teams t
      where not exists (select 1 from public.memberships m where m.team_id = t.id)
    `;
    console.log(`[limpieza] usuarios de prueba borrados: ${borrados.length}`);
  } finally {
    await sql.end();
  }
}
