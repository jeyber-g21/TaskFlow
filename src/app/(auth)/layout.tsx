import type { ReactNode } from "react";

import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Logo />
        <span className="text-base font-semibold tracking-tight">TaskFlow</span>
      </Link>
      {children}
    </main>
  );
}
