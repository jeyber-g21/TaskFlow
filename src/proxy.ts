import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// En Next.js 16 el antiguo `middleware.ts` pasó a llamarse `proxy.ts`.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas salvo las que no necesitan sesión:
     * archivos estáticos, imágenes optimizadas, el favicon y los assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
