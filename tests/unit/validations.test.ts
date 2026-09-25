import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/lib/validations/auth";

/**
 * Estos esquemas corren en el navegador y en el servidor. Lo que se prueba
 * aquí es lo que el servidor rechazará aunque alguien manipule el formulario.
 */

describe("loginSchema", () => {
  it("acepta unas credenciales normales", () => {
    const resultado = loginSchema.safeParse({
      email: "jeyber@ejemplo.com",
      password: "cualquiera",
    });

    expect(resultado.success).toBe(true);
  });

  it("rechaza un email sin arroba", () => {
    const resultado = loginSchema.safeParse({
      email: "jeyber-ejemplo.com",
      password: "cualquiera",
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza la contraseña vacía", () => {
    const resultado = loginSchema.safeParse({
      email: "jeyber@ejemplo.com",
      password: "",
    });

    expect(resultado.success).toBe(false);
  });

  it("no impone longitud mínima al entrar", () => {
    // Al iniciar sesión da igual lo corta que sea: la contraseña ya existe.
    // Exigir 8 caracteres aquí dejaría fuera a cuentas antiguas.
    const resultado = loginSchema.safeParse({
      email: "jeyber@ejemplo.com",
      password: "abc",
    });

    expect(resultado.success).toBe(true);
  });

  it("devuelve mensajes en español", () => {
    const resultado = loginSchema.safeParse({ email: "no-es-email", password: "" });

    expect(resultado.success).toBe(false);
    if (resultado.success) return;

    const mensajes = resultado.error.issues.map((i) => i.message);
    expect(mensajes).toContain("Introduce un email válido.");
    expect(mensajes).toContain("Escribe tu contraseña.");
  });
});

describe("registerSchema", () => {
  const valido = {
    fullName: "Jeyber Gómez",
    email: "jeyber@ejemplo.com",
    password: "contraseña-larga",
  };

  it("acepta un registro completo", () => {
    expect(registerSchema.safeParse(valido).success).toBe(true);
  });

  it("exige al menos 8 caracteres de contraseña", () => {
    const resultado = registerSchema.safeParse({ ...valido, password: "1234567" });

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(resultado.error.issues[0].message).toContain("8 caracteres");
  });

  it("corta en 72 caracteres, que es el límite de bcrypt", () => {
    const resultado = registerSchema.safeParse({ ...valido, password: "a".repeat(73) });

    expect(resultado.success).toBe(false);
  });

  it("recorta los espacios del nombre", () => {
    const resultado = registerSchema.safeParse({ ...valido, fullName: "  Jeyber  " });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.fullName).toBe("Jeyber");
  });

  it("rechaza un nombre que solo tiene espacios", () => {
    const resultado = registerSchema.safeParse({ ...valido, fullName: "   " });

    expect(resultado.success).toBe(false);
  });

  it("rechaza un nombre de una sola letra", () => {
    expect(registerSchema.safeParse({ ...valido, fullName: "J" }).success).toBe(false);
  });
});
