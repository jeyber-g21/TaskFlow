import { Logo } from "@/components/marketing/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-medium text-foreground">TaskFlow</span>
          <span>— proyecto de portafolio</span>
        </div>
        <p>
          Construido con Next.js, Supabase y Tailwind CSS por Jeyber Gómez.
        </p>
      </div>
    </footer>
  );
}
