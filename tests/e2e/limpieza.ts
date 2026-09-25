import postgres from "postgres";

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
    const borrados = await sql`
      delete from auth.users
      where email like 'e2e-%@taskflow-pruebas.dev'
      returning email
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
