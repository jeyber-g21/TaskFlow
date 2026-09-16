# TaskFlow — Gestor de tareas de equipo (proyecto de portafolio fullstack)

> Blueprint completo para construir un SaaS pequeño pero **completo** que demuestre nivel semi senior / jr avanzado. Pensado para desarrollarse con **Claude en VSCode** y desplegarse en plataformas 100% gratuitas.

---

## 1. La idea

**TaskFlow** es una mini-aplicación SaaS donde equipos pueden organizar su trabajo en proyectos y tareas, con distintos roles de usuario. Es el clásico "gestor de tareas", pero construido en serio: con autenticación real, roles, relaciones en base de datos, validaciones en front y back, y despliegue con CI/CD.

No es la idea lo que impresiona (es a propósito conocida), sino **cómo la ejecutas**. Un reclutador técnico abre tu demo, crea una cuenta, invita a un compañero, ve que los permisos funcionan, que los errores se manejan bien, que carga rápido, y entiende que sabes conectar todas las piezas de un producto real.

> Nota: si prefieres, la misma arquitectura sirve para un **mini-CRM** (contactos → oportunidades → notas) o un **control de gastos** (categorías → transacciones → reportes). Elige el que más te motive; el esqueleto técnico es idéntico.

---

## 2. Qué demuestra a quien te contrata

Este proyecto, bien hecho, cubre casi todo lo que se evalúa a nivel semi senior:

- **Autenticación y autorización** — login, registro, sesiones, rutas protegidas y **roles** (admin / miembro).
- **Modelado de datos relacional** — tablas con relaciones (usuarios ↔ equipos ↔ proyectos ↔ tareas).
- **CRUD completo** con validación en cliente y servidor.
- **Manejo de estados** — loading, error, vacío y éxito en la UI.
- **Trabajo con servicios externos** — base de datos gestionada, auth, storage.
- **Despliegue real con CI/CD** — cada push actualiza la demo automáticamente.
- **Criterio de producto y de UX** — un flujo pensado, no una pantalla suelta.

---

## 3. Funcionalidades

### MVP (lo mínimo para que impresione)

- Registro e inicio de sesión (email + contraseña).
- Crear un **equipo/workspace** al registrarse.
- Invitar a otros usuarios al equipo por email.
- Roles: **Admin** (gestiona el equipo) y **Miembro** (colabora).
- Crear **proyectos** dentro del equipo.
- Dentro de cada proyecto, crear/editar/eliminar **tareas** con: título, descripción, estado (`todo` / `en progreso` / `hecho`), prioridad y responsable asignado.
- Vista de tablero tipo Kanban con las tres columnas de estado.
- Rutas protegidas: sin sesión, redirige al login.

### Extras que suben el nivel (añade 1 o 2, no todos)

- **Drag & drop** para mover tareas entre columnas.
- **Tiempo real**: cuando un compañero mueve una tarea, la ves actualizarse sola.
- Filtros y búsqueda de tareas (por responsable, prioridad o texto).
- Comentarios en cada tarea.
- Modo claro/oscuro.
- Página de **actividad reciente** (audit log sencillo).

> Consejo: es mejor un MVP pulido + 1 extra bien hecho que 8 features a medias. La calidad se nota más que la cantidad.

---

## 4. Stack tecnológico

Elegido para ser gratis, moderno y bien visto por reclutadores, y para que encaje perfecto con Claude en VSCode.

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | **Next.js** (App Router) + **TypeScript** | Front y API en un mismo repo. TypeScript demuestra madurez. |
| Estilos | **Tailwind CSS** | Rápido, consistente, estándar de la industria. |
| Componentes UI | **shadcn/ui** | Componentes accesibles y elegantes sin reinventar la rueda. |
| Base de datos | **Supabase (PostgreSQL)** | Postgres gestionado gratis + panel visual. |
| Autenticación | **Supabase Auth** | Login, registro y sesiones listos, sin montar servidor. |
| ORM / acceso a datos | **Drizzle ORM** o cliente de Supabase | Drizzle da queries tipadas; suma puntos técnicos. |
| Validación | **Zod** | Validación tipada compartida entre front y back. |
| Estado servidor | **TanStack Query** (opcional) | Cache y estados de carga/error bien resueltos. |
| Tiempo real | **Supabase Realtime** (opcional) | Para el extra de actualizaciones en vivo. |
| Tests | **Vitest** + **Playwright** | Unitarios y un par de tests end-to-end. |
| Hosting | **Vercel** | Despliegue automático desde GitHub, gratis. |

> Justifica tus elecciones en el README: "elegí X porque…". Poder explicar tus decisiones técnicas es justo lo que distingue a un semi senior.

---

## 5. Arquitectura general

```
┌─────────────────────────────────────────────┐
│                  Navegador                   │
│   Next.js (React) + Tailwind + shadcn/ui     │
└───────────────┬─────────────────────────────┘
                │  fetch / server actions
                ▼
┌─────────────────────────────────────────────┐
│            Next.js (backend/API)             │
│   Route handlers / Server Actions            │
│   Validación con Zod · Lógica de negocio     │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│                  Supabase                    │
│   PostgreSQL · Auth · (Realtime · Storage)   │
│   Row Level Security (RLS) para permisos     │
└─────────────────────────────────────────────┘
```

Punto fuerte para destacar: usar **Row Level Security (RLS)** de Postgres para que cada usuario solo pueda leer/escribir datos de su propio equipo. Es seguridad a nivel de base de datos y demuestra que piensas en permisos en serio, no solo escondiendo botones en el front.

---

## 6. Modelo de datos

Esquema relacional mínimo (Postgres):

```
teams
  id            uuid  (pk)
  name          text
  created_at    timestamptz

profiles                        (extiende auth.users de Supabase)
  id            uuid  (pk, fk → auth.users)
  full_name     text
  avatar_url    text

memberships                     (relación usuario ↔ equipo con rol)
  id            uuid  (pk)
  team_id       uuid  (fk → teams)
  user_id       uuid  (fk → profiles)
  role          text  ('admin' | 'member')

projects
  id            uuid  (pk)
  team_id       uuid  (fk → teams)
  name          text
  description   text
  created_at    timestamptz

tasks
  id            uuid  (pk)
  project_id    uuid  (fk → projects)
  title         text
  description   text
  status        text  ('todo' | 'in_progress' | 'done')
  priority      text  ('low' | 'medium' | 'high')
  assignee_id   uuid  (fk → profiles, nullable)
  created_at    timestamptz
  updated_at    timestamptz
```

Relaciones clave: un equipo tiene muchos miembros y muchos proyectos; un proyecto tiene muchas tareas; cada tarea puede tener un responsable. Esto es exactamente el tipo de modelado relacional que se espera que domines.

---

## 7. Diseño (UI / UX)

El diseño no tiene que ser espectacular, pero sí **cuidado y coherente**. Un portafolio con buena UX comunica criterio.

### Páginas / pantallas

1. **Landing pública** — hero corto explicando qué es, un par de capturas y botón "Probar demo" / "Registrarse".
2. **Registro / Login** — formularios limpios, con validación visible y estados de carga.
3. **Dashboard** — lista de proyectos del equipo, botón para crear proyecto.
4. **Vista de proyecto (Kanban)** — las tres columnas (Por hacer / En progreso / Hecho) con las tarjetas de tareas.
5. **Modal / panel de tarea** — para ver y editar detalle, asignar responsable, cambiar prioridad.
6. **Ajustes del equipo** — invitar miembros, ver roles (solo admin).

### Dirección visual

- **Paleta**: una neutra (grises/slate) + **un color de acento** para acciones primarias (por ejemplo un índigo o un teal). No uses cinco colores; la contención se ve profesional.
- **Tipografía**: una sans-serif moderna como **Inter** o **Geist**. Una sola familia, con jerarquía por peso y tamaño.
- **Espaciado generoso** y bordes suaves (`rounded-lg`). Deja respirar la interfaz.
- **Estados siempre visibles**: skeletons al cargar, mensaje amable cuando una lista está vacía ("Aún no tienes tareas, crea la primera"), y errores claros.
- **Prioridad como color**: alta = rojo suave, media = ámbar, baja = gris. Ayuda a leer el tablero de un vistazo.
- **Accesibilidad**: contraste suficiente, foco visible, navegable con teclado. shadcn/ui ya te ayuda mucho aquí.

> Antes de programar, haz un boceto rápido (aunque sea en papel o en Figma gratis) del dashboard y del tablero. Programar sobre una idea visual clara evita rehacer.

---

## 8. Estructura de carpetas sugerida

```
taskflow/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   └── page.tsx            # landing pública
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── projects/[id]/      # tablero Kanban
│   │   │   └── settings/
│   │   └── api/                    # route handlers si los necesitas
│   ├── components/
│   │   ├── ui/                     # shadcn/ui
│   │   ├── tasks/
│   │   └── projects/
│   ├── lib/
│   │   ├── supabase/               # clientes de Supabase
│   │   ├── validations/            # esquemas Zod
│   │   └── db/                     # Drizzle (schema, queries)
│   └── hooks/
├── tests/
├── .env.local                      # variables (NO subir a git)
├── .env.example                    # plantilla que SÍ subes
└── README.md
```

---

## 9. Roadmap por fases

Construye por capas para no abrumarte. Cada fase es un commit (o varios) con algo que funciona.

1. **Base** — inicializar Next.js + TypeScript + Tailwind + shadcn/ui. Landing simple. Deploy inicial a Vercel (aunque esté casi vacío, así el pipeline está listo desde el día uno).
2. **Auth** — conectar Supabase Auth: registro, login, logout, rutas protegidas.
3. **Datos** — crear tablas en Supabase, configurar RLS, conectar el ORM.
4. **Equipos y proyectos** — crear equipo al registrarse, CRUD de proyectos.
5. **Tareas** — CRUD de tareas + vista Kanban con las columnas.
6. **Roles e invitaciones** — invitar miembros, permisos admin/miembro.
7. **Pulido** — estados vacíos, loading, manejo de errores, responsive, modo oscuro.
8. **Un extra** — drag & drop o tiempo real.
9. **Tests + README** — un par de tests e2e del flujo principal y el README final.

---

## 10. Despliegue (100% gratis, paso a paso)

### Base de datos y auth — Supabase

1. Crea una cuenta en supabase.com y un proyecto nuevo (tier gratuito).
2. En el editor SQL o en la UI, crea las tablas del modelo de datos.
3. Activa **Row Level Security** en cada tabla y escribe las políticas (cada usuario solo ve datos de sus equipos).
4. Copia tus claves: `SUPABASE_URL` y `SUPABASE_ANON_KEY` (y la `service_role` solo para el servidor, nunca al cliente).

### Frontend + backend — Vercel

1. Sube tu repo a **GitHub**.
2. En vercel.com, importa el repositorio. Vercel detecta Next.js solo.
3. Añade las variables de entorno (las mismas de tu `.env.local`) en el panel de Vercel.
4. Deploy. A partir de aquí, **cada push a `main` redespliega automáticamente** → eso es tu CI/CD funcionando.

### Buenas prácticas de despliegue

- Nunca subas `.env.local` a git (añádelo a `.gitignore`). Sí sube un `.env.example` con las claves vacías.
- Usa una rama para features y `main` para lo estable; Vercel te da previews por cada rama.
- Pon el enlace de la demo y el del repo bien visibles en tu portafolio.

**Resultado**: front, backend, base de datos y auth desplegados sin pagar nada, con despliegue automático.

---

## 11. Detalles que marcan la diferencia (nivel semi senior)

- **README serio**: qué resuelve el proyecto, capturas o gif, stack y **por qué** cada elección, cómo correrlo localmente, y decisiones/limitaciones conocidas.
- **Tests**: aunque sean pocos. Un par de tests e2e con Playwright del flujo "registro → crear proyecto → crear tarea" ya demuestra que sabes probar software.
- **TypeScript estricto** y validación con Zod en el servidor (nunca confíes solo en la validación del front).
- **Commits limpios** y con mensajes claros: tu historial de git también se revisa.
- **Manejo de errores real**: qué ve el usuario si la red falla, si no tiene permisos, si el formulario está mal.
- **Accesibilidad y responsive**: que funcione en móvil y sea navegable con teclado.

---

## 12. Cómo aprovechar Claude en VSCode

- Empieza pidiéndole que te ayude a **inicializar el proyecto** con el stack de arriba y a configurar Tailwind + shadcn/ui.
- Ve **fase por fase** del roadmap; no le pidas "hazme toda la app". Trabajar por capas te deja entender cada parte (y poder explicarla en una entrevista).
- Pídele que **te explique** lo que genera, no solo que lo escriba. En la entrevista te preguntarán por tu propio código.
- Úsalo para **revisar y refactorizar**: "revisa este componente y sugiere mejoras de accesibilidad/rendimiento".
- Pídele ayuda con lo que suele costar: las **políticas RLS** de Supabase, los tipos de TypeScript, y los tests.
- Que te ayude a redactar el **README** y los mensajes de commit.

> Regla de oro: usa Claude para acelerar y aprender, pero asegúrate de **entender cada pieza**. El objetivo del portafolio es que puedas defender tu trabajo, no solo mostrarlo.

---

### Primer paso concreto

Abre VSCode y pídele a Claude: *"Inicializa un proyecto Next.js con App Router, TypeScript, Tailwind y shadcn/ui, y crea una landing simple para 'TaskFlow'. Luego lo subimos a Vercel."* A partir de ahí, sigue el roadmap de la sección 9.

¡Éxito con tu portafolio! 🚀
