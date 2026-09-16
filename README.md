# TaskFlow

Gestor de tareas para equipos pequeños: proyectos, tablero Kanban, roles y
permisos aplicados en la propia base de datos.

> **Estado**: en construcción. Fases 1 y 2 de 9 completadas (base del proyecto,
> despliegue continuo y autenticación). Ver [roadmap](#roadmap).

- **Demo**: <https://taskflow-jg.vercel.app>
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
git clone https://github.com/jeyber-g21/TaskFlow.git
cd TaskFlow
npm install
cp .env.example .env.local   # rellena los valores de Supabase
npm run dev
```

La app queda en <http://localhost:3000>.

> Necesitas un proyecto de Supabase (tier gratuito). Las claves están en
> *Project Settings → API*. Sin ellas la app no arranca: la validación de
> entorno falla a propósito al inicio, en vez de romperse más tarde.

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
│   ├── (auth)/           # login, registro y server actions de sesión
│   ├── (app)/            # zona privada: requiere sesión
│   ├── auth/callback/    # canjea el enlace de confirmación por una sesión
│   └── layout.tsx        # fuentes, metadatos y shell de la app
├── components/
│   ├── ui/               # componentes de shadcn/ui
│   ├── auth/             # formularios de acceso
│   ├── app/              # piezas de la zona privada
│   └── marketing/        # cabecera, pie y piezas de la landing
├── lib/
│   ├── supabase/         # clientes de navegador, servidor y proxy
│   ├── validations/      # esquemas Zod compartidos
│   └── env.ts            # validación de variables de entorno
└── proxy.ts              # refresco de sesión y guardia de rutas
```

## Decisiones y limitaciones conocidas

- **Los permisos viven en la base de datos.** Esconder botones en el cliente no
  es seguridad. Cada tabla llevará RLS, de modo que una petición que se salte la
  UI tampoco podrá leer datos de otro equipo.
- **Validación duplicada a propósito.** El mismo esquema de Zod corre en el
  cliente (respuesta inmediata) y en el servidor (la que de verdad protege).
- **La sesión se valida con `getUser()`, no con `getSession()`.** El segundo
  lee la cookie sin comprobarla contra Supabase, así que es falsificable.
- **Rutas protegidas por partida doble.** El proxy redirige a quien no tiene
  sesión, y el layout privado vuelve a comprobarlo. Si algún día cambia el
  `matcher` del proxy, las rutas no quedan expuestas por accidente.
- **La confirmación por email está desactivada a propósito.** El correo que
  incluye el plan gratuito de Supabase está pensado solo para pruebas y limita
  los envíos por hora, así que en una demo pública alguien podría registrarse y
  no recibir nunca el enlace. La ruta `/auth/callback` que canjea el código por
  una sesión sigue implementada, porque es la misma que usa la recuperación de
  contraseña y porque reactivar la confirmación es cambiar un interruptor.
- **Sin tests todavía.** Llegan en la Fase 9: unitarios con Vitest y un
  recorrido end-to-end con Playwright sobre el flujo registro → proyecto → tarea.

## Roadmap

- [x] **1. Base** — Next.js + TypeScript + Tailwind + shadcn/ui, landing y deploy inicial
- [x] **2. Auth** — registro, login, logout y rutas protegidas con Supabase
- [ ] **3. Datos** — tablas, políticas RLS y Drizzle conectado
- [ ] **4. Equipos y proyectos** — workspace al registrarse y CRUD de proyectos
- [ ] **5. Tareas** — CRUD de tareas y vista Kanban
- [ ] **6. Roles e invitaciones** — permisos de admin y miembro
- [ ] **7. Pulido** — estados vacíos, carga, errores, responsive y modo oscuro
- [ ] **8. Filtros y búsqueda** — por responsable, prioridad y texto
- [ ] **9. Tests y README final**

---

Proyecto de portafolio de Jeyber Gómez.
