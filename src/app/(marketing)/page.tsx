import Image from "next/image";
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

/** Se rotan para que la rejilla de funciones tenga ritmo de color. */
const TINTES = [
  "bg-primary/10 text-primary",
  "bg-acento/10 text-acento",
  "bg-acento-2/15 text-acento-2",
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
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        {/* Resplandor de fondo: da profundidad sin cargar ninguna imagen. */}
        <div
          aria-hidden
          className="fondo-hero pointer-events-none absolute inset-x-0 -top-32 h-[42rem]"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
            <div>
              <Badge variant="secondary" className="aparece mb-5">
                Proyecto de portafolio · en construcción
              </Badge>

              <h1 className="aparece aparece-1 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                El trabajo de tu equipo,{" "}
                <span className="texto-degradado">en un solo tablero</span>
              </h1>

              <p className="aparece aparece-2 mt-6 max-w-lg text-lg text-pretty text-muted-foreground">
                TaskFlow organiza proyectos y tareas para equipos pequeños:
                roles, responsables y prioridades, sin la complejidad de las
                herramientas grandes.
              </p>

              <div className="aparece aparece-3 mt-8 flex flex-col gap-3 sm:flex-row">
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

              <p className="aparece aparece-4 mt-4 text-sm text-muted-foreground">
                Sin tarjeta. Sin instalación. Funciona en el navegador.
              </p>
            </div>

            {/* El tablero se inclina levemente en pantallas grandes para que se
                lea como un producto y no como una captura pegada. */}
            <div className="aparece aparece-2 lg:[perspective:1600px]">
              <div className="lg:[transform:rotateY(-7deg)_rotateX(3deg)] lg:origin-left lg:transition-transform lg:duration-500 lg:hover:[transform:rotateY(-3deg)_rotateX(1deg)]">
                <BoardPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ funciones */}
      <section
        id="funciones"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6"
      >
        <div className="revela">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Lo que necesitas, nada más
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Un gestor de tareas se vuelve inútil cuando pide más mantenimiento
            del que ahorra. TaskFlow se queda en lo esencial.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, indice) => (
            <Card key={feature.title} className="tarjeta-viva revela h-full">
              <CardHeader>
                <span
                  className={`mb-1 flex size-9 items-center justify-center rounded-lg ${TINTES[indice % TINTES.length]}`}
                >
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

      {/* -------------------------------------------------------- cómo funciona */}
      <section
        id="como-funciona"
        className="seccion-tintada scroll-mt-20 border-y border-border/60 py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="revela">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Cómo funciona
              </h2>
              <p className="mt-3 max-w-md text-pretty text-muted-foreground">
                Tres pasos y el equipo ya está trabajando sobre el mismo tablero.
              </p>

              <ol className="mt-8 space-y-6">
                {STEPS.map((item, indice) => (
                  <li key={item.step} className="flex gap-4">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-medium ${TINTES[indice % TINTES.length]}`}
                    >
                      {item.step}
                    </span>
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="mt-1 text-sm text-pretty text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="revela relative">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-3xl bg-linear-to-br from-primary/10 via-acento/10 to-acento-2/10 blur-2xl"
              />
              <Image
                src="/equipo-engranajes.jpg"
                alt="Ilustración de un equipo montando entre todos un mecanismo de engranajes"
                width={1700}
                height={980}
                sizes="(min-width: 1024px) 40rem, 100vw"
                className="relative w-full rounded-xl shadow-lg shadow-primary/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- stack */}
      <section
        id="stack"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6"
      >
        <Card className="revela relative overflow-hidden border-primary/20">
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-acento/8"
          />
          <CardContent className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold tracking-tight text-balance">
                Construido con herramientas de producción
              </h2>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">
                Autenticación real, base de datos relacional con permisos a
                nivel de fila, validación compartida entre cliente y servidor, y
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
