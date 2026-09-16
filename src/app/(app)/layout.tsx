import type { ReactNode } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { UserMenu } from "@/components/app/user-menu";
import { Logo } from "@/components/marketing/logo";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El proxy ya redirige a quien no tiene sesión. Esta segunda comprobación
  // es deliberada: si algún día cambia el matcher, estas rutas no quedan
  // expuestas por accidente.
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo />
            <span className="text-base font-semibold tracking-tight">TaskFlow</span>
          </Link>

          <UserMenu email={user.email ?? ""} />
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </>
  );
}
