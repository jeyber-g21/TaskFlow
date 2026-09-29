/**
 * Aplica el tema antes de que la página se pinte.
 *
 * Tiene que ser un script en línea y no un efecto de React: si esperásemos a
 * que React monte, quien tenga el modo oscuro vería un fogonazo blanco en cada
 * carga. Por eso corre de forma síncrona, antes que nada.
 */
const SCRIPT = `
(function () {
  try {
    var guardado = localStorage.getItem("tema");
    var prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var oscuro = guardado === "oscuro" || (guardado !== "claro" && prefiereOscuro);
    document.documentElement.classList.toggle("dark", oscuro);
  } catch (e) {
    // Sin localStorage (navegación privada, cookies bloqueadas) se queda el
    // tema claro, que es el de por defecto. No merece romper la página.
  }
})();
`;

export function ThemeScript() {
  return (
    <script
      // El contenido es una constante escrita aquí mismo, no entra nada de
      // fuera: no hay forma de inyectar código a través de esto.
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
      suppressHydrationWarning
    />
  );
}
