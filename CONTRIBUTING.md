# Guía de contribución

Gracias por tu interés en StockPilot. Esta guía resume cómo preparar el entorno, las convenciones
del código y el flujo de trabajo para proponer cambios.

## Requisitos

- Node.js 20.19 o superior (recomendado 22) y npm.
- Un proyecto de PostgreSQL en [Supabase](https://supabase.com) (plan gratuito) o cualquier
  PostgreSQL 15+. No se instala ninguna base de datos en el equipo ni se usan contenedores.

## Puesta en marcha

```bash
git clone https://github.com/blowerlol355-blip/invetario-project-.git
cd invetario-project-
npm install                # genera el cliente Prisma (postinstall)
cp .env.example .env       # DATABASE_URL = cadena "Session pooler" de Supabase; AUTH_SECRET aleatorio
npm run db:deploy          # aplica las migraciones
npm run db:seed            # usuarios demo, catálogos, 150 productos y ~540 movimientos
npm run dev                # http://localhost:3000
```

Usuarios demo: `admin@stockpilot.dev` / `Admin123!`, `manager@stockpilot.dev` / `Manager123!`,
`operator@stockpilot.dev` / `Operator123!`.

## Comandos útiles

| Comando               | Descripción                                                |
| --------------------- | ---------------------------------------------------------- |
| `npm run lint`        | ESLint (`lint:fix` corrige)                                |
| `npm run format`      | Prettier (`format:check` solo verifica)                    |
| `npm run typecheck`   | `tsc --noEmit`                                             |
| `npm run test`        | Tests unitarios con Vitest (`test:watch`, `test:coverage`) |
| `npm run build`       | Build de producción                                        |
| `npm run test:e2e`    | Tests E2E con Playwright (requiere `npm run build` previo) |
| `npm run screenshots` | Regenera las capturas de `docs/screenshots` para el README |
| `npm run db:studio`   | Prisma Studio                                              |
| `npm run db:reset`    | Reinicia la base y vuelve a sembrar (destructivo)          |

La primera vez que ejecutes los E2E instala el navegador: `npx playwright install chromium`, o usa
el instalado en tu equipo con `PLAYWRIGHT_CHANNEL=chrome` (o `msedge`).

## Convenciones

- **Idioma**: código en inglés; interfaz, documentación, comentarios y commits en español.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/es/) validados por
  commitlint. Ejemplo: `feat(products): agregar filtro por categoría`. Scopes habituales:
  `setup`, `db`, `auth`, `catalogs`, `products`, `stock`, `purchasing`, `dashboard`, `reports`,
  `users`, `audit`, `api`, `ui`, `tests`, `ci`, `docs`.
- **Formato regional**: fechas `dd/MM/yyyy` y moneda USD mediante `src/lib/format.ts`.
- **Estructura**: cada módulo vive en `src/features/<módulo>/` con `schemas.ts`, `queries.ts`,
  `actions.ts` y `components/`. Ver `docs/ARCHITECTURE.md` y `CLAUDE.md` para el patrón completo.
- **Seguridad**: toda Server Action y Route Handler valida el permiso en el servidor
  (`requirePermission` / `apiRoute`). Nunca confíes en la UI.
- **Stock**: solo `applyStockMovement` escribe en `stocks`.
- **Base de datos**: los cambios de esquema van con migración Prisma. Si necesitan SQL manual
  (CHECK, índices filtrados), usa `prisma migrate dev --create-only` y edita el archivo.
- **API**: cualquier ruta nueva o cambiada en `/api/v1` debe reflejarse en `public/openapi.yaml`;
  un test unitario comprueba la coherencia.

## Flujo de trabajo

1. Crea una rama desde `main`: `git checkout -b feat/nombre-corto`.
2. Implementa el cambio con sus tests (unitarios para reglas de negocio; E2E si cambia un flujo
   de usuario).
3. Ejecuta `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build`. Husky ejecuta
   lint-staged y commitlint en cada commit.
4. Actualiza la documentación afectada (`README.md`, `docs/`, `CHANGELOG.md` en _Unreleased_).
5. Abre un pull request describiendo el problema, la solución y cómo probarla. La CI debe pasar.

## Reportar problemas

Abre un issue con los pasos para reproducir, el comportamiento esperado y el observado, y la
versión de Node y PostgreSQL. Si es una vulnerabilidad de seguridad, contacta al autor de forma
privada en lugar de abrir un issue público.
