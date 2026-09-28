import { ID_EJECUCION } from "./ejecucion";

/**
 * Fija el identificador de ejecución antes de que arranquen los workers, para
 * que todos usen el mismo y la limpieza final sepa qué borrar.
 */
export default function prepararEjecucion() {
  process.env.E2E_RUN_ID = ID_EJECUCION;
}
