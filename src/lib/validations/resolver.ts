import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Conecta un esquema de Zod con react-hook-form.
 *
 * Sustituye a `@hookform/resolvers`, del que solo usábamos esta función: ese
 * paquete trae resolvers para Joi, Yup, Ajv y media docena más, y su árbol de
 * dependencias entraba en conflicto con el de ESLint hasta romper `npm ci`.
 * Doce líneas propias salen más baratas que arrastrar todo aquello.
 */
export function resolverZod<T extends FieldValues>(esquema: ZodType<T>): Resolver<T> {
  return async (valores) => {
    const resultado = esquema.safeParse(valores);

    if (resultado.success) {
      return { values: resultado.data, errors: {} };
    }

    const errores: Record<string, { type: string; message: string }> = {};

    for (const problema of resultado.error.issues) {
      const campo = problema.path.join(".");
      // Solo el primer error de cada campo: enseñar tres mensajes a la vez
      // sobre el mismo input no ayuda a nadie.
      if (campo && !errores[campo]) {
        errores[campo] = { type: problema.code, message: problema.message };
      }
    }

    return { values: {}, errors: errores as FieldErrors<T> };
  };
}
