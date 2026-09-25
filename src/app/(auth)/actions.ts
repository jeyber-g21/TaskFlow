"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { traducirErrorDeAuth } from "@/lib/supabase/errores";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
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
