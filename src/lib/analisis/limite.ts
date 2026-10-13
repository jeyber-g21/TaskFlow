/**
 * Análisis con IA que puede pedir cada equipo en 24 horas.
 *
 * Quien lo hace cumplir es `claim_board_analysis()` en Postgres
 * (drizzle/0008_limite_de_analisis.sql); este valor solo sirve para mostrar
 * cuántos quedan. Si cambia uno, tiene que cambiar el otro.
 */
export const LIMITE_DIARIO_ANALISIS = 5;

/** Código propio con el que Postgres avisa de que no queda cupo. */
export const CODIGO_LIMITE_ALCANZADO = "TF429";

/** Cabecera en la que la respuesta en streaming dice cuántos quedan. */
export const CABECERA_RESTANTES = "X-Analisis-Restantes";

export function analisisRestantes(usados: number): number {
  return Math.max(0, LIMITE_DIARIO_ANALISIS - usados);
}
