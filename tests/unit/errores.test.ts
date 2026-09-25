import { describe, expect, it } from "vitest";

import { esErrorDeRedireccion } from "@/lib/errors";
import { traducirErrorDeAuth } from "@/lib/supabase/errores";

describe("traducirErrorDeAuth", () => {
  it("traduce credenciales incorrectas", () => {
    expect(traducirErrorDeAuth("Invalid login credentials")).toBe(
      "El email o la contraseña no son correctos.",
    );
  });

  it("no depende de las mayúsculas", () => {
    expect(traducirErrorDeAuth("INVALID LOGIN CREDENTIALS")).toBe(
      "El email o la contraseña no son correctos.",
    );
  });

  it("avisa de que el email ya está registrado", () => {
    expect(traducirErrorDeAuth("User already registered")).toContain(
      "Ya existe una cuenta",
    );
  });

  it("reconoce la otra redacción que usa Supabase para el email duplicado", () => {
    expect(traducirErrorDeAuth("Email address has already been registered")).toContain(
      "Ya existe una cuenta",
    );
  });

  it("explica el límite de intentos", () => {
    expect(traducirErrorDeAuth("Email rate limit exceeded")).toContain(
      "Demasiados intentos",
    );
  });

  it("da un mensaje genérico ante un error desconocido", () => {
    expect(traducirErrorDeAuth("Something exploded in the database")).toBe(
      "No hemos podido completar la operación. Inténtalo de nuevo.",
    );
  });

  it("nunca filtra el mensaje original al usuario", () => {
    // Un error sin traducir no debería enseñar detalles internos.
    const mensaje = traducirErrorDeAuth("connection to 10.0.0.3:5432 refused");

    expect(mensaje).not.toContain("10.0.0.3");
    expect(mensaje).not.toContain("5432");
  });
});

describe("esErrorDeRedireccion", () => {
  it("reconoce el error interno con el que Next navega", () => {
    expect(esErrorDeRedireccion({ digest: "NEXT_REDIRECT;replace;/dashboard;307" })).toBe(
      true,
    );
  });

  it("no confunde un error normal con una redirección", () => {
    expect(esErrorDeRedireccion(new Error("fallo de red"))).toBe(false);
  });

  it("aguanta valores raros sin romperse", () => {
    expect(esErrorDeRedireccion(null)).toBe(false);
    expect(esErrorDeRedireccion(undefined)).toBe(false);
    expect(esErrorDeRedireccion("NEXT_REDIRECT")).toBe(false);
    expect(esErrorDeRedireccion({ digest: 42 })).toBe(false);
  });
});
