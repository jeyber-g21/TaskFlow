import { describe, expect, it } from "vitest";

import { calcularIniciales } from "@/lib/nombres";
import { COLUMNAS, taskSchema } from "@/lib/validations/task";

const UUID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

const valida = {
  title: "Definir las políticas de permisos",
  description: "Con dos usuarios de prueba",
  status: "todo" as const,
  priority: "high" as const,
  assigneeId: UUID,
};

describe("taskSchema", () => {
  it("acepta una tarea completa", () => {
    expect(taskSchema.safeParse(valida).success).toBe(true);
  });

  it("acepta una tarea sin responsable", () => {
    const resultado = taskSchema.safeParse({ ...valida, assigneeId: null });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.assigneeId).toBeNull();
  });

  it("convierte el responsable vacío del desplegable en null", () => {
    const resultado = taskSchema.safeParse({ ...valida, assigneeId: "" });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.assigneeId).toBeNull();
  });

  it("rechaza un responsable que no es un identificador válido", () => {
    // Si alguien manipula el formulario, la base de datos lo rechazaría con un
    // error feo. Mejor detenerlo antes y con un mensaje entendible.
    const resultado = taskSchema.safeParse({ ...valida, assigneeId: "pepito" });

    expect(resultado.success).toBe(false);
  });

  it("rechaza un estado inventado", () => {
    expect(taskSchema.safeParse({ ...valida, status: "archivada" }).success).toBe(
      false,
    );
  });

  it("rechaza una prioridad inventada", () => {
    expect(taskSchema.safeParse({ ...valida, priority: "urgentísima" }).success).toBe(
      false,
    );
  });

  it("exige un título con contenido", () => {
    expect(taskSchema.safeParse({ ...valida, title: " " }).success).toBe(false);
  });

  it("limita la descripción a 1000 caracteres", () => {
    expect(
      taskSchema.safeParse({ ...valida, description: "a".repeat(1001) }).success,
    ).toBe(false);
  });
});

describe("COLUMNAS", () => {
  it("van en el orden en que avanza el trabajo", () => {
    expect(COLUMNAS.map((c) => c.estado)).toEqual(["todo", "in_progress", "done"]);
  });
});

describe("calcularIniciales", () => {
  it("toma la inicial del nombre y del primer apellido", () => {
    expect(calcularIniciales("Jeyber Gómez García")).toBe("JG");
  });

  it("funciona con un solo nombre", () => {
    expect(calcularIniciales("Ana")).toBe("A");
  });

  it("aguanta espacios de más", () => {
    expect(calcularIniciales("  ana   maría  ")).toBe("AM");
  });

  it("devuelve cadena vacía si no hay nombre", () => {
    expect(calcularIniciales("   ")).toBe("");
  });
});
