"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { traducirErrorDeAuth } from "@/lib/supabase/errores";
import {
  loginSchema,
  nuevaContrasenaSchema,
  recuperarSchema,
  registerSchema,
  type LoginInput,
  type NuevaContrasenaInput,
  type RecuperarInput,
  type RegisterInput,
} from "@/lib/validations/auth";

/** Lo que devuelve una acción cuando algo va mal. */
export type AuthResult =
  | { status: "error"; message: string }
  | { status: "success"; message: string };

export async function signIn(
  input: LoginInput,
  next?: string,
): Promise<AuthResult> {
  // Se revalida en el servidor aunque el cliente ya lo hiciera.
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Revisa los datos del formulario." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: traducirErrorDeAuth(error.message) };
  }

  revalidatePath("/", "layout");
  // Solo rutas internas: un `next` con URL absoluta permitiría redirigir
  // a un dominio ajeno desde un enlace manipulado.
  redirect(next?.startsWith("/") ? next : "/dashboard");
}

export async function signUp(input: RegisterInput): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Revisa los datos del formulario." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Se guarda en los metadatos del usuario; en la fase 3 pasará a la
      // tabla `profiles` mediante un trigger.
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { status: "error", message: traducirErrorDeAuth(error.message) };
  }

  // Con la confirmación por email activada, Supabase no abre sesión todavía.
  if (!data.session) {
    return {
      status: "success",
      message:
        "Te hemos enviado un email para confirmar la cuenta. Ábrelo para terminar el registro.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Envía el correo para restablecer la contraseña.
 *
 * Responde lo mismo exista o no la cuenta. Si dijera "ese email no está
 * registrado", cualquiera podría usar el formulario para averiguar quién tiene
 * cuenta en TaskFlow.
 */
export async function pedirRecuperacion(
  input: RecuperarInput,
): Promise<AuthResult> {
  const parsed = recuperarSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Introduce un email válido." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: origin
      ? `${origin}/auth/callback?next=/nueva-contrasena`
      : undefined,
  });

  return {
    status: "success",
    message:
      "Si existe una cuenta con ese email, te hemos enviado un enlace para cambiar la contraseña.",
  };
}

/**
 * Guarda la contraseña nueva.
 *
 * Funciona porque el enlace del correo ya dejó una sesión abierta al pasar por
 * /auth/callback: sin ella, `updateUser` no tiene a quién actualizar.
 */
export async function cambiarContrasena(
  input: NuevaContrasenaInput,
): Promise<AuthResult> {
  const parsed = nuevaContrasenaSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "El enlace ha caducado. Pide otro para cambiar la contraseña.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: traducirErrorDeAuth(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
