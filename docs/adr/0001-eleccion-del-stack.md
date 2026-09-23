# ADR 0001: Elección del stack tecnológico

- **Estado:** aceptado
- **Fecha:** 2026-09-22

## Contexto

StockPilot es una aplicación de gestión de inventario para pequeñas y medianas empresas, pensada
como proyecto de portafolio con calidad de producción. Necesita: interfaz rica y responsiva,
lógica de negocio transaccional sobre una base relacional, autenticación con roles, una API REST
pública y una base sólida de tests y documentación.

## Decisión

| Área          | Elección                              | Motivo principal                                                             |
| ------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| Framework     | Next.js 15 (App Router) + React 19    | Server Components, Server Actions y Route Handlers en un solo proyecto.      |
| Lenguaje      | TypeScript en modo estricto           | Seguridad de tipos extremo a extremo, incluyendo esquemas Zod compartidos.   |
| Base de datos | Microsoft SQL Server 2022             | Motor relacional robusto y común en empresas; instancia local o remota.      |
| ORM           | Prisma 7 (provider `sqlserver`)       | Migraciones versionadas, tipos generados y transacciones interactivas.       |
| Autenticación | Auth.js v5 con credenciales y JWT     | Integración nativa con App Router y middleware; sin dependencia de terceros. |
| UI            | Tailwind CSS v4 + shadcn/ui + lucide  | Componentes accesibles y personalizables que viven en el repositorio.        |
| Formularios   | React Hook Form + Zod                 | Validación idéntica en cliente y servidor con un solo esquema.               |
| Tablas        | TanStack Table                        | Paginación, orden y filtros del lado del servidor sin acoplarse a una UI.    |
| Gráficas      | Recharts                              | Declarativo, ligero y suficiente para KPIs de dashboard.                     |
| Testing       | Vitest + Testing Library + Playwright | Unitarios rápidos para reglas de negocio y E2E reales para flujos críticos.  |
| Calidad       | ESLint, Prettier, Husky, commitlint   | Estilo consistente y commits convencionales desde el primer día.             |

## Consecuencias

- Prisma 7 elimina el motor nativo de consultas; el cliente usa el driver adapter
  `@prisma/adapter-mssql`, que acepta la misma URL `sqlserver://` que las migraciones.
  Esto simplifica la configuración a una sola variable `DATABASE_URL`.
- SQL Server no crea bases de datos desde la cadena de conexión: el script `npm run db:create`
  (`scripts/create-database.ts`) la crea de forma idempotente antes de la primera migración.
- La base de datos corre como servicio local de Windows (SQL Server 2022 Developer), sin
  contenedores, por decisión del autor.
- Auth.js v5 sigue etiquetado como beta en npm, pero es la versión recomendada para App Router.
  Se fija la versión en `package.json` para evitar cambios inesperados.
