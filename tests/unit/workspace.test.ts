import { describe, expect, it } from "vitest";

import { projectSchema, teamSchema } from "@/lib/validations/workspace";

describe("teamSchema", () => {
  it("acepta un nombre normal", () => {
    expect(teamSchema.safeParse({ name: "Equipo de Producto" }).success).toBe(true);
  });

  it("recorta los espacios", () => {
    const resultado = teamSchema.safeParse({ name: "  Diseño  " });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.name).toBe("Diseño");
  });

  it("rechaza un nombre que solo tiene espacios", () => {
    expect(teamSchema.safeParse({ name: "     " }).success).toBe(false);
  });

  it("rechaza nombres demasiado largos", () => {
    expect(teamSchema.safeParse({ name: "a".repeat(61) }).success).toBe(false);
  });

  it("añade el proyecto de ejemplo si no se dice lo contrario", () => {
    const resultado = teamSchema.safeParse({ name: "Equipo" });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.conEjemplo).toBe(true);
  });

  it("respeta que se desmarque el proyecto de ejemplo", () => {
    const resultado = teamSchema.safeParse({ name: "Equipo", conEjemplo: false });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.conEjemplo).toBe(false);
  });
});

describe("projectSchema", () => {
  it("acepta nombre y descripción", () => {
    const resultado = projectSchema.safeParse({
      name: "Rediseño del onboarding",
      description: "Reducir los pasos del alta",
    });

    expect(resultado.success).toBe(true);
  });

  it("convierte una descripción vacía en null", () => {
    // El formulario envía "" cuando el campo se deja en blanco, pero en la
    // base de datos eso debe ser NULL y no una cadena vacía.
    const resultado = projectSchema.safeParse({ name: "Proyecto", description: "" });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.description).toBeNull();
  });

  it("convierte en null una descripción de solo espacios", () => {
    const resultado = projectSchema.safeParse({ name: "Proyecto", description: "   " });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.description).toBeNull();
  });

  it("admite que la descripción llegue como null", () => {
    const resultado = projectSchema.safeParse({ name: "Proyecto", description: null });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.description).toBeNull();
  });

  it("rechaza un nombre de una sola letra", () => {
    expect(projectSchema.safeParse({ name: "P", description: null }).success).toBe(false);
  });

  it("rechaza descripciones que pasan de 280 caracteres", () => {
    const resultado = projectSchema.safeParse({
      name: "Proyecto",
      description: "a".repeat(281),
    });

    expect(resultado.success).toBe(false);
  });

  it("cuenta los caracteres después de recortar, no antes", () => {
    // 280 caracteres rodeados de espacios siguen siendo válidos.
    const resultado = projectSchema.safeParse({
      name: "Proyecto",
      description: `   ${"a".repeat(280)}   `,
    });

    expect(resultado.success).toBe(true);
  });
});
