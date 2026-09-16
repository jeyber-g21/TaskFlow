import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  ListChecks,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { BoardPreview } from "@/components/marketing/board-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Tablero Kanban",
    description:
      "Por hacer, En progreso y Hecho. Mueve una tarea y todo el equipo ve el mismo estado.",
  },
  {
    icon: Users,
    title: "Equipos y roles",
    description:
      "Invita compañeros por email. Los admins gestionan el equipo; los miembros colaboran.",
  },
  {
    icon: ShieldCheck,
    title: "Permisos de verdad",
    description:
      "Row Level Security en Postgres: cada persona solo puede leer y escribir datos de su equipo.",
  },
  {
    icon: ListChecks,
    title: "Tareas con contexto",
    description:
      "Título, descripción, prioridad y responsable. Lo justo para organizarse sin burocracia.",
  },
  {
    icon: Search,
    title: "Filtros y búsqueda",
    description:
      "Encuentra cualquier tarea por responsable, prioridad o texto sin salir del tablero.",
  },
  {
    icon: ArrowRight,
    title: "Rápido de adoptar",
    description:
      "Te registras, creas tu equipo y tienes el primer proyecto en marcha en menos de un minuto.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Crea tu equipo",
    description:
      "Al registrarte se crea tu workspace. Invita a quien trabaje contigo y asígnale su rol.",
  },
  {
    step: "02",
    title: "Abre un proyecto",
    description:
      "Cada proyecto agrupa el trabajo de una iniciativa, con su propio tablero independiente.",
  },
  {
    step: "03",
    title: "Mueve las tareas",
    description:
      "Crea tareas, asigna responsables y arrástralas por el tablero conforme avanza el trabajo.",
  },
];

const STACK = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "Supabase",
  "PostgreSQL",
  "Drizzle ORM",
  "Zod",
  "Vercel",
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-5">
              Proyecto de portafolio · en construcción
            </Badge>

            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              El trabajo de tu equipo,{" "}
              <span className="text-primary">en un solo tablero</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg text-pretty text-muted-foreground">
              TaskFlow organiza proyectos y tareas para equipos pequeños: roles,
              responsables y prioridades, sin la complejidad de las herramientas
              grandes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Crear cuenta gratis
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Probar la demo</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Sin tarjeta. Sin instalación. Funciona en el navegador.
            </p>
          </div>

          <BoardPreview />
        </div>
      </section>

      <section
        id="funciones"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Lo que necesitas, nada más
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Un gestor de tareas se vuelve inútil cuando pide más mantenimiento del
          que ahorra. TaskFlow se queda en lo esencial.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-4.5" aria-hidden />
                </span>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription className="text-pretty">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-y border-border/60 bg-muted/30 py-16"
      >
        <div className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Cómo funciona
          </h2>

          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((item) => (
              <li key={item.step}>
                <span className="font-mono text-sm font-medium text-primary">
                  {item.step}
                </span>
                <h3 className="mt-2 font-medium">{item.title}</h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="stack"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold tracking-tight">
                Construido con herramientas de producción
              </h2>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">
                Autenticación real, base de datos relacional con permisos a nivel
                de fila, validación compartida entre cliente y servidor, y
                despliegue continuo en cada push.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {STACK.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <Button asChild size="lg" className="shrink-0">
              <Link href="/register">
                Empezar ahora
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
