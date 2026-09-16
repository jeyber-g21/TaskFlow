# TaskFlow

Gestor de tareas para equipos pequeños: proyectos, tablero Kanban, roles y
permisos aplicados en la propia base de datos.

> **Estado**: en construcción. Fase 1 de 9 completada (base del proyecto,
> landing y despliegue continuo). Ver [roadmap](#roadmap).

- **Demo**: _(pendiente de publicar)_
- **Blueprint del proyecto**: [`docs/proyecto-taskflow-portafolio.md`](docs/proyecto-taskflow-portafolio.md)

---

## Qué resuelve

Los equipos de tres o cuatro personas necesitan saber quién hace qué y en qué
estado está, pero las herramientas grandes piden más mantenimiento del que
ahorran. TaskFlow se queda en lo esencial: equipos con roles, proyectos y un
tablero de tres columnas con responsable y prioridad por tarea.

## Stack y por qué

| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | **Next.js 16** (App Router) + TypeScript | Front y backend en un solo repo y un solo despliegue. Los Server Components dejan las consultas a base de datos en el servidor, sin exponer credenciales. |
| Estilos | **Tailwind CSS v4** | Sin archivos de CSS que mantener en paralelo; el diseño vive junto al marcado. |
| Componentes | **shadcn/ui** (base Radix) | Componentes accesibles por defecto (foco, teclado, ARIA) que se copian al repo, así que son modificables en lugar de ser una caja negra. |
| Base de datos | **Supabase (PostgreSQL)** | Postgres gestionado en tier gratuito, con panel visual y **Row Level Security** para aplicar permisos en la base de datos, no solo en la UI. |
| Autenticación | **Supabase Auth** | Sesiones, registro y recuperación resueltos, integrados con las políticas RLS mediante `auth.uid()`. |
| Acceso a datos | **Drizzle ORM** | Consultas tipadas de extremo a extremo y migraciones versionadas en el repo, en vez de cambios manuales en un panel. |
| Validación | **Zod** | Un único esquema compartido: valida el formulario en el cliente y vuelve a validar en el servidor, donde sí importa. |
| Hosting | **Vercel** | Despliegue automático en cada push y previews por rama. |

## Cómo ejecutarlo en local

Requisitos: Node.js 20 o superior.

```bash
git clone <url-del-repo>
cd taskflow
npm install
cp .env.example .env.local   # rellena los valores de Supabase
npm run dev
```

La app queda en <http://localhost:3000>.

> Las variables de entorno aún no son necesarias: la Fase 1 es estática. Harán
> falta a partir de la Fase 2 (autenticación).

### Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

## Estructura

```
src/
├── app/
│   ├── (marketing)/      # landing pública
│   ├── (auth)/           # login y registro
│   └── layout.tsx        # fuentes, metadatos y shell de la app
├── components/
│   ├── ui/               # componentes de shadcn/ui
│   └── marketing/        # cabecera, pie y piezas de la landing
└── lib/                  # utilidades compartidas
```

## Decisiones y limitaciones conocidas

- **Los permisos viven en la base de datos.** Esconder botones en el cliente no
  es seguridad. Cada tabla llevará RLS, de modo que una petición que se salte la
  UI tampoco podrá leer datos de otro equipo.
- **Validación duplicada a propósito.** El mismo esquema de Zod corre en el
  cliente (respuesta inmediata) y en el servidor (la que de verdad protege).
- **`/login` y `/register` son provisionales.** Muestran un aviso hasta que la
  Fase 2 conecte Supabase Auth.
- **Sin tests todavía.** Llegan en la Fase 9: unitarios con Vitest y un
  recorrido end-to-end con Playwright sobre el flujo registro → proyecto → tarea.

## Roadmap

- [x] **1. Base** — Next.js + TypeScript + Tailwind + shadcn/ui, landing y deploy inicial
- [ ] **2. Auth** — registro, login, logout y rutas protegidas con Supabase
- [ ] **3. Datos** — tablas, políticas RLS y Drizzle conectado
- [ ] **4. Equipos y proyectos** — workspace al registrarse y CRUD de proyectos
- [ ] **5. Tareas** — CRUD de tareas y vista Kanban
- [ ] **6. Roles e invitaciones** — permisos de admin y miembro
- [ ] **7. Pulido** — estados vacíos, carga, errores, responsive y modo oscuro
- [ ] **8. Filtros y búsqueda** — por responsable, prioridad y texto
- [ ] **9. Tests y README final**

---

Proyecto de portafolio de Jeyber Gómez.
