import { LogOut } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function UserMenu({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {email}
      </span>

      {/* Un form en lugar de un onClick: cerrar sesión cambia estado en el
          servidor, así que no debería viajar por GET ni depender de JS. */}
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut />
          Salir
        </Button>
      </form>
    </div>
  );
}
