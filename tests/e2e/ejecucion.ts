/**
 * Identificador de esta ejecución de tests.
 *
 * Los tests crean usuarios reales en una base de datos compartida: la misma
 * que usa quien programa en su máquina y la que usa el CI. Si la limpieza
 * borrase por un patrón común, una ejecución arrasaría con los usuarios de
 * otra que estuviera corriendo a la vez, y los fallos parecerían aleatorios.
 *
 * Con este identificador dentro de cada email, cada ejecución borra
 * exactamente lo que creó y nada más.
 */
export const ID_EJECUCION =
  process.env.E2E_RUN_ID ??
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const DOMINIO_PRUEBAS = "taskflow-pruebas.dev";

/** Prefijo con el que empiezan todos los emails de esta ejecución. */
export const PREFIJO = `e2e-${ID_EJECUCION}`;
