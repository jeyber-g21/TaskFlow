/**
 * `redirect()` de Next navega lanzando un error interno. Si un `catch`
 * genérico se lo traga, la navegación no ocurre y el usuario se queda
 * mirando un formulario que aparentemente no hizo nada.
 */
export function esErrorDeRedireccion(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}
