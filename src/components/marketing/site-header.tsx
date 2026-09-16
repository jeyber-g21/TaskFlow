import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Logo />
          <span className="text-base font-semibold tracking-tight">TaskFlow</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Secciones">
          <a
            href="#funciones"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Funciones
          </a>
          <a
            href="#como-funciona"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cómo funciona
          </a>
          <a
            href="#stack"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Stack
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
