/**
 * Igual que en los recorridos: cada ejecución marca sus usuarios para poder
 * borrar solo los suyos. La base de datos es compartida entre quien programa
 * y el CI, y una limpieza por patrón común se llevaría por delante los
 * usuarios de una ejecución que estuviera corriendo a la vez.
 */
export const ID_EJECUCION = `${Date.now().toString(36)}${Math.random()
  .toString(36)
  .slice(2, 6)}`;

export const DOMINIO_PRUEBAS = "taskflow-pruebas.dev";

/** Emails de esta ejecución: <grupo>-<id>-... */
export function emailDePrueba(grupo: string, etiqueta: string) {
  const unico = Math.random().toString(36).slice(2, 8);
  return `${grupo}-${ID_EJECUCION}-${etiqueta}-${unico}@${DOMINIO_PRUEBAS}`;
}

export function patronDeLimpieza(grupo: string) {
  return `${grupo}-${ID_EJECUCION}-%@${DOMINIO_PRUEBAS}`;
}
