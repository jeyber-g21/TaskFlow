import { describe, expect, it } from "vitest";

import {
  SIN_RESPONSABLE,
  TODOS,
  hayFiltrosActivos,
  leerFiltros,
} from "@/lib/validations/filtros";

/**
 * Los filtros llegan desde la URL, que cualquiera puede escribir a mano. Lo
 * que se comprueba aquí es que una dirección manipulada no rompa la página.
 */

describe("leerFiltros", () => {
  it("sin parámetros, no filtra por nada", () => {
    expect(leerFiltros({})).toEqual({
      q: "",
      prioridad: TODOS,
      responsable: TODOS,
    });
  });

  it("lee los tres filtros de la URL", () => {
    expect(
      leerFiltros({ q: "onboarding", prioridad: "high", responsable: "abc" }),
    ).toEqual({ q: "onboarding", prioridad: "high", responsable: "abc" });
  });

  it("recorta los espacios del término de búsqueda", () => {
    expect(leerFiltros({ q: "  diseño  " }).q).toBe("diseño");
  });

  it("ignora una prioridad inventada en lugar de romperse", () => {
    // Alguien escribe ?prioridad=urgentísima en la barra de direcciones: la
    // página debe seguir funcionando, no reventar.
    expect(leerFiltros({ prioridad: "urgentísima" }).prioridad).toBe(TODOS);
  });

  it("se queda con el primer valor si un parámetro viene repetido", () => {
    expect(leerFiltros({ prioridad: ["high", "low"] }).prioridad).toBe("high");
  });

  it("acepta el valor de 'sin responsable'", () => {
    expect(leerFiltros({ responsable: SIN_RESPONSABLE }).responsable).toBe(
      SIN_RESPONSABLE,
    );
  });

  it("corta una búsqueda desmesurada", () => {
    // Un término larguísimo no debería llegar a la consulta.
    expect(leerFiltros({ q: "a".repeat(500) }).q).toBe("");
  });
});

describe("hayFiltrosActivos", () => {
  it("es falso cuando no hay ninguno", () => {
    expect(hayFiltrosActivos(leerFiltros({}))).toBe(false);
  });

  it("basta con el texto", () => {
    expect(hayFiltrosActivos(leerFiltros({ q: "algo" }))).toBe(true);
  });

  it("basta con la prioridad", () => {
    expect(hayFiltrosActivos(leerFiltros({ prioridad: "low" }))).toBe(true);
  });

  it("basta con el responsable", () => {
    expect(
      hayFiltrosActivos(leerFiltros({ responsable: SIN_RESPONSABLE })),
    ).toBe(true);
  });
});
