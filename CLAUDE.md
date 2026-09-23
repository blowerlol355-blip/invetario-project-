# StockPilot — Guía del proyecto para Claude Code

Sistema de gestión de inventario para PyMEs. Proyecto de portafolio con calidad de producción.
Las especificaciones completas están en `docs/REQUISITOS.md`. Este archivo resume convenciones,
comandos y decisiones que deben respetarse en cada fase.

## Estado del proyecto

| Fase | Descripción                                         | Estado        |
| ---- | --------------------------------------------------- | ------------- |
| 1    | Setup, tooling, base de datos, Prisma conectado     | ✅ Completada |
| 2    | Esquema de base de datos, migraciones y seed        | ✅ Completada |
| 3    | Autenticación, roles, middleware y layout principal | ✅ Completada |
| 4    | Catálogos: categorías, proveedores, almacenes       | ✅ Completada |
| 5    | Productos con tabla avanzada y detalle              | ✅ Completada |
| 6    | Movimientos de stock con transacciones              | ✅ Completada |
| 7    | Órdenes de compra y alertas                         | ✅ Completada |
| 8    | Dashboard y reportes con exportación                | ✅ Completada |
| 9    | Usuarios, auditoría y API REST con OpenAPI          | ✅ Completada |
| 10   | Tests, CI, documentación final y pulido visual      | ✅ Completada |
| 11   | Migración a PostgreSQL (Supabase) y despliegue      | ✅ Completada |

## Forma de trabajo

1. Una fase a la vez. Al cerrar cada fase: `npm run build`, `npm run lint`, `npm run typecheck`
   y `npm run test` deben pasar. Resumir lo hecho, sugerir mensaje de commit y esperar aprobación.
2. Ante ambigüedad, preguntar en lugar de suponer.
3. Mantener este archivo, `CHANGELOG.md` y la documentación en `docs/` actualizados.

## Convenciones

- **Idioma:** código (variables, funciones, tablas, columnas) en inglés. UI, documentación,
  comentarios y mensajes de commit en español.
- **Commits:** Conventional Commits con descripción en español, validados por commitlint.
  Ejemplo: `feat(products): agregar filtro por categoría`. Scopes sugeridos: `setup`, `db`,
  `auth`, `catalogs`, `products`, `stock`, `purchasing`, `dashboard`, `reports`, `users`,
  `audit`, `api`, `ui`, `tests`, `ci`, `docs`.
- **Formato regional:** fechas en formato sudamericano `dd/MM/yyyy` (nunca `MM/dd/yyyy`),
  moneda en dólares (USD). Los formateadores centralizados vivirán en `src/lib/format.ts`.
- **Imports:** ordenados automáticamente por `simple-import-sort`; usar alias `@/`.
  Preferir `import { type X }` para tipos.
- **Componentes:** Server Components por defecto; `"use client"` solo cuando haga falta
  (estado, efectos, eventos, hooks de librerías cliente).
- **Mutaciones:** Server Actions en `src/features/<módulo>/actions.ts`. Route Handlers solo para
  la API REST pública (`/api/v1`) y exportaciones.
- **Validación:** esquemas Zod en `src/features/<módulo>/schemas.ts`, compartidos entre
  cliente (React Hook Form) y servidor (Server Actions / API).
- **Permisos:** verificar el rol en cada Server Action y Route Handler, nunca solo en el cliente.
- **Errores:** nunca exponer errores internos de SQL o Prisma al usuario; mapearlos a mensajes
  claros en español.
- **Estilos:** Tailwind v4 con tokens en `src/app/globals.css`. Usar los tokens semánticos
  (`primary`, `success`, `warning`, `info`, `destructive`) en lugar de colores literales.
- **Animaciones:** `tw-animate-css` para entradas simples y `motion` para secuencias. Respetar
  `prefers-reduced-motion`.
- **JSDoc:** en funciones públicas y lógica compleja. No comentar lo obvio.

## Estructura de carpetas

```
src/
  app/
    (auth)/          rutas públicas de autenticación (login)
    (dashboard)/     rutas protegidas de la aplicación
    api/             Route Handlers (API REST v1, exportaciones)
  components/
    ui/              componentes shadcn/ui (generados, se pueden ajustar)
    forms/ tables/ charts/ layout/ providers/ landing/
  features/<módulo>/ actions.ts, queries.ts, schemas.ts, components/
  lib/               db.ts, env.ts, utils.ts, auth, permissions, format
  generated/prisma/  cliente Prisma generado (ignorado por git)
  types/             tipos compartidos
prisma/              schema.prisma, migrations/, seed.ts
scripts/             utilidades de desarrollo (create-database.ts)
tests/               setup.ts, unit/, e2e/
docs/                documentación y ADRs
```

## Comandos

| Comando               | Descripción                                                 |
| --------------------- | ----------------------------------------------------------- |
| `npm run dev`         | Servidor de desarrollo (Turbopack) en http://localhost:3000 |
| `npm run build`       | Build de producción                                         |
| `npm run lint`        | ESLint (`lint:fix` corrige)                                 |
| `npm run format`      | Prettier sobre todo el proyecto (`format:check` verifica)   |
| `npm run typecheck`   | `tsc --noEmit`                                              |
| `npm run test`        | Vitest (`test:watch`, `test:coverage`)                      |
| `npm run db:generate` | Genera el cliente Prisma                                    |
| `npm run db:migrate`  | Crea/aplica migraciones en desarrollo                       |
| `npm run db:deploy`   | Aplica migraciones pendientes (producción/CI)               |
| `npm run db:seed`     | Ejecuta `prisma/seed.ts`                                    |
| `npm run db:studio`   | Abre Prisma Studio                                          |
| `npm run db:reset`    | Reinicia la base de datos y vuelve a sembrar                |

## Decisiones de arquitectura

Ver `docs/adr/` para el detalle. Resumen:

- **Prisma 7 con driver adapter.** No hay motor nativo; `src/lib/db.ts` crea el cliente con
  `@prisma/adapter-pg` (`connectionString: DATABASE_URL`, pool `max` 3 en producción). El cliente
  se genera en `src/generated/prisma` (provider `prisma-client`) y se importa desde
  `@/generated/prisma/client`. `prisma.config.ts` usa `DIRECT_URL` (si existe) o `DATABASE_URL`
  para migraciones y seed, con un marcador cuando faltan para que `prisma generate` (postinstall)
  no falle en `npm install`.
- **Variables de entorno.** Validadas con Zod en `src/lib/env.ts`, importado desde
  `next.config.ts` para fallar al arrancar. `SKIP_ENV_VALIDATION=true` las omite (CI).
  Nunca importar `env.ts` desde componentes cliente. Los scripts sueltos que importen `@/lib/db`
  deben ejecutarse con `npx tsx --env-file=.env <archivo>` (tsx no carga `.env` por sí solo).
- **PostgreSQL en Supabase, sin Docker ni instalación local.** Desde la Fase 11 (ADR 0004) la
  base es PostgreSQL alojada en Supabase tanto en producción como en desarrollo: el usuario no
  quiere contenedores ni instalar bases de datos en su equipo. En `.env` local `DATABASE_URL` es el
  _session pooler_ (puerto 5432); en Vercel `DATABASE_URL` es el _transaction pooler_ (6543) y
  `DIRECT_URL` el session pooler. El proyecto nació en SQL Server 2022 (Fases 1-10); las
  migraciones de SQL Server se reemplazaron por una migración inicial de PostgreSQL.
- **Cabeceras de seguridad** en `next.config.ts`. La CSP está en modo estricto desde la Fase 10.
- **Stock solo vía movimientos.** Un único servicio de dominio aplicará movimientos dentro de
  `prisma.$transaction` (Fase 6). Ninguna otra ruta modifica `Stock` directamente.
- **Costo promedio ponderado.** `Product.avgCost` se recalcula en cada entrada con costo.

## Modelo de datos (resumen; detalle en docs/DATABASE.md)

- **Sin enums ni Json de Prisma.** role, type, status y action son VARCHAR con constraints
  CHECK escritos a mano en la migración; los valores válidos y sus etiquetas en español viven en
  `src/lib/domain.ts` (USER_ROLES, MOVEMENT_TYPES, PURCHASE_ORDER_STATUSES, AUDIT_ACTIONS).
  Los esquemas Zod deben derivarse de esas listas. Los snapshots de auditoría son TEXT con JSON.
- **PostgreSQL distingue mayúsculas en `contains`:** toda búsqueda de texto con Prisma lleva
  `mode: "insensitive"` y el SQL crudo usa `ILIKE`. En SQL crudo: `COALESCE`, `LIMIT/OFFSET`,
  booleanos sin `= 1`, y los parámetros `Date` se pasan como `${d.toISOString()}::timestamp`.
  Los agregados `SUM`/`COUNT` llegan como bigint/Decimal: convertir siempre con `Number()`.
- **Nombres:** tablas snake_case plural y columnas snake_case (`@map`); en TypeScript camelCase.
- **Convención de movimientos:** quantity siempre > 0. IN usa toWarehouseId, OUT fromWarehouseId,
  TRANSFER ambos, ADJUSTMENT exactamente uno (to = aumenta, from = disminuye). Un CHECK lo exige.
- **Costo promedio:** `calculateWeightedAverageCost` en `src/features/stock/lib/average-cost.ts`
  es la única implementación; el seed y el servicio de movimientos (Fase 6) la comparten.
- **Unicidad de barcode y taxId** se valida en la aplicación dentro de la transacción (mensaje de
  campo claro y una sola implementación de las reglas).
- **Migraciones con SQL manual:** al crear una migración que necesite CHECK u otro SQL propio,
  usar `prisma migrate dev --create-only`, editar el archivo dentro de la transacción y aplicar.
  `prisma migrate reset` requiere consentimiento explícito del usuario (Prisma lo bloquea para
  agentes); pedirlo siempre y pasar el texto en PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION.
- **Seed determinista** (`prisma/seed.ts`, semilla fija): deriva stock y avgCost reproduciendo los
  movimientos en orden cronológico. Usuarios demo: admin@stockpilot.dev / Admin123!,
  manager@stockpilot.dev / Manager123!, operator@stockpilot.dev / Operator123!.
- **Contraseñas** con `bcryptjs` (implementación pura en JS, sin compilación nativa en Windows).

## Autenticación y permisos (Fase 3)

- **Auth.js v5** con proveedor de credenciales y sesión JWT (8 h). `src/lib/auth.config.ts` es la
  configuración compatible con Edge (sin Prisma) que usa el middleware; `src/lib/auth.ts` añade el
  proveedor con Prisma + bcryptjs y exporta `auth`, `signIn`, `signOut` y `handlers`.
- **Permisos granulares** en `src/lib/permissions.ts` (matriz rol -> permisos). En Server Actions y
  Route Handlers usar siempre `requirePermission("x:y")` de `src/lib/auth-guards.ts`; lanza
  `AuthorizationError` (401/403) que la acción convierte en mensaje. Nunca confiar en la UI.
- **Navegación única** en `src/lib/navigation.ts`: cada sección define ruta, icono, etiqueta y
  permiso. Middleware (protección por ruta), sidebar (menú filtrado por rol) y breadcrumbs lo leen.
  Al crear un módulo nuevo, añadir su entrada ahí y no en tres sitios.
- **Middleware** (`src/middleware.ts`): exige sesión salvo /login, /api/auth, /api/v1 y /api-docs;
  redirige a /login?callbackUrl=..., a /dashboard si ya hay sesión, y a /forbidden si el rol no
  tiene el permiso de la sección.
- **Login**: Server Action `loginAction` con rate limiting en memoria (5 intentos / 15 min por IP +
  correo, `src/lib/rate-limit.ts`) y validación de callbackUrl contra open redirects. La pantalla
  muestra los usuarios demo y rellena las credenciales al hacer clic.
- **Layout**: `src/app/(dashboard)/layout.tsx` valida la sesión, lee la cookie `sidebar_state` y
  monta `AppSidebar` + `AppHeader` (breadcrumbs, tema, menú de usuario). Las páginas usan
  `PageHeader`; los módulos pendientes muestran `ComingSoon` hasta implementarse.
- **Formato**: usar siempre `src/lib/format.ts` (fechas dd/MM/yyyy, moneda USD con símbolo $).

## Patrón CRUD de un módulo (Fase 4; replicar en los siguientes)

Cada módulo vive en `src/features/<módulo>/` con:

- `schemas.ts`: esquema Zod **sin transforms** (mismo tipo de entrada y salida para React Hook Form);
  los campos opcionales son `""` en el formulario y se convierten a `null` en la acción.
- `queries.ts` (`import "server-only"`): `list<Entidad>(params: ListParams)` devuelve
  `Paginated<Row>` usando `resolveSort` (lista blanca de columnas), `statusWhere`, `pagination` y
  `paginate` de `src/lib/query-params.ts`; más `get<Entidad>Options()` para selects.
- `actions.ts` (`"use server"`): cada acción hace `requirePermission`, valida con Zod, ejecuta en
  `prisma.$transaction` junto con `recordAudit`, llama `revalidatePath` y devuelve
  `ActionResult` vía `ok()` / `toActionError(error, { unique })`. Nunca lanza al cliente.
- `components/`: `<entidad>-dialog.tsx` (crear/editar con `useActionForm`), `create-<entidad>-button`,
  `<entidad>-row-actions` (editar + activar/desactivar con `ConfirmDialog`) y `<entidad>s-table`
  (columnas TanStack v8 + `DataTable`).
- Página en `src/app/(dashboard)/<ruta>/page.tsx`: `parseListParams(await searchParams)`, consulta,
  `PageHeader` y tabla con `sortState`.

Reglas transversales:

- **TanStack Table fijado en v8** (`@tanstack/react-table@^8`); la v9 cambia los genéricos.
- La tabla es 100 % server-side: el estado (página, tamaño, orden, búsqueda, estado) vive en la URL
  (`useTableParams`). No usar filtrado/orden en cliente.
- Soft delete: "Desactivar" pone `isActive=false` y se audita como `DELETE`; reactivar como `UPDATE`.
  Reglas: no desactivar categorías con productos activos, proveedores con órdenes abiertas ni
  almacenes con existencias.
- Unicidad: `toActionError` reconoce P2002 leyendo también `meta.driverAdapterError` (los driver
  adapters no siempre rellenan `meta.target`). Para columnas opcionales únicas (taxId, barcode) validar a
  mano en la transacción.
- `server-only` está mapeado a un módulo vacío en Vitest (`tests/mocks/server-only.ts`) para poder
  testear módulos de servidor; `@/lib/auth` se mockea con `vi.mock` cuando hace falta.
- Probar Server Actions contra el build real: POST a la ruta de la página con cabecera
  `Next-Action: <id>` (ids en `.next/server/server-reference-manifest.json`) y cuerpo JSON de args.

## Productos (Fase 5)

- Formulario en página completa (`/products/new`, `/products/[id]/edit`) con `ProductForm`; los
  campos numéricos usan `register(..., { setValueAs })` para convertir "" en `undefined`/`null` y
  que Zod devuelva mensajes propios (`z.number({ error })`). Selects con `Controller`.
- Las consultas convierten `Decimal` a `number` antes de devolver filas: los objetos Decimal de
  Prisma no se pueden pasar a Client Components.
- Filtros adicionales al listado (`categoryId`, `supplierId`) se validan con
  `productFiltersSchema` (UUID o vacío) y se inyectan en `DataTable` vía la prop `filters`.
- Estado de stock (`getStockStatus`: out/low/ok/over) y margen (`getMarginPercent`) en
  `src/features/products/lib/stock-status.ts`; `StockStatusBadge` y `MovementTypeBadge` son los
  componentes visuales compartidos.
- Rutas de creación/edición protegidas también en el middleware mediante
  `ROUTE_PERMISSION_RULES` (src/lib/navigation.ts). Al añadir páginas `new`/`edit` en otros módulos,
  registrar allí su patrón. Las páginas además comprueban el permiso y redirigen a /forbidden.
- Con render dinámico + streaming, `notFound()` y `redirect()` dentro de la página devuelven
  HTTP 200 con el contenido correcto (los headers ya se enviaron); por eso la protección real
  está en el middleware.
- Reglas: SKU único (P2002), código de barras único validado en la transacción, categoría y
  proveedor deben estar activos al crear o al cambiarlos, no se desactiva un producto con
  existencias.

## Movimientos de stock (Fase 6)

- `applyStockMovement(tx, command)` en `src/features/stock/lib/apply-movement.ts` es la ÚNICA
  función que modifica `stocks`. Cualquier módulo que necesite mover stock (órdenes de compra,
  API) la llama dentro de su transacción; nunca escribir en `stock` directamente.
- `runStockMovement(command)` (`run-movement.ts`) abre la transacción Serializable, audita y
  reintenta P2034. Las Server Actions usan esta.
- La resta de stock es una actualización condicional (`updateMany` con `quantity >= n`); si
  devuelve 0 filas, se lanza BusinessRuleError. No cambiar por read-modify-write.
- El formulario (`movement-form.tsx`) tiene tres campos de almacén (from/to/warehouseId) para que
  el esquema Zod sea un único objeto; `toMovementCommand` en `actions.ts` lo traduce a la
  convención from/to de la base.
- Tests del servicio con un doble en memoria (`tests/unit/features/stock/fake-db.ts`, usa
  `structuredClone` para aislar el estado). Al ampliar el servicio, ampliar el doble.
- Reglas detalladas en `docs/BUSINESS_RULES.md`.

## Órdenes de compra y alertas (Fase 7)

- Ciclo de vida en `src/features/purchase-orders/lib/status.ts` (`canPerform` / `assertCanPerform`):
  editar y enviar solo en DRAFT, recibir en SENT o PARTIALLY_RECEIVED, cancelar en DRAFT o SENT.
  Toda acción llama `assertCanPerform` dentro de la transacción.
- Código correlativo `OC-AAAA-NNNN` con `buildPurchaseOrderCode` (último código del año + 1) dentro
  de una transacción serializable; un choque de unicidad se reporta como conflicto reintentable.
- Recepción: `planReceipt` (puro, testeado) valida cantidades contra lo pendiente y decide el
  estado final; la acción aplica el plan llamando a `applyStockMovement` por línea (IN con el costo
  del ítem y `reference = código`) en la misma transacción que actualiza ítems y estado.
- Permiso nuevo `purchase-orders:receive` (OPERATOR y superiores) separado de
  `purchase-orders:manage` (MANAGER y ADMIN): el operador recibe mercancía pero no crea ni cancela.
- Transacciones con reintento en `src/lib/transaction.ts` (`withSerializableTransaction`), compartido
  por movimientos y recepciones.
- Alertas: la condición `SUM(stocks) <= min_stock` se resuelve con SQL crudo (`Prisma.sql`) en
  `src/features/alerts/queries.ts`, con paginación OFFSET/FETCH; marca los productos que ya están
  en una orden abierta. El botón "Crear orden" abre `/purchase-orders/new?productId=` con el
  proveedor del producto y la cantidad sugerida (hasta el máximo o el doble del mínimo).
- Formularios con listas dinámicas usan `useFieldArray`; los ítems duplicados se detectan en
  `superRefine` con path `["items", i, "productId"]`.

## Dashboard y reportes (Fase 8)

- Agregados (valor del inventario, serie diaria, top 10, alertas) en SQL crudo con `Prisma.sql`
  en `src/features/dashboard/queries.ts`; las fechas se agrupan con
  `CONVERT(varchar(10), created_at, 23)` para evitar problemas de zona horaria, y
  `fillDailySeries` rellena los días sin movimientos.
- Gráficas con Recharts 3: serie 1 `--viz-series-1` (azul) y serie 2 `--viz-series-2` (naranja),
  paleta validada para daltonismo en claro y oscuro (tokens en globals.css). Reglas: barras de
  máximo 24 px con extremo redondeado, rejilla hairline, leyenda solo con 2+ series, tooltip
  propio (`content={<ChartTooltip />}` con props tipadas a mano; el genérico de Recharts no encaja).
  Nunca dos ejes Y en una gráfica.
- Reportes: cada uno se define una vez en `src/features/reports/registry.ts` como `ReportTable`
  (título, columnas, filas, totales) y de ahí salen CSV (`lib/csv.ts`, BOM + CRLF) y PDF
  (`lib/pdf.ts`, pdfmake 0.3 con API singleton `setFonts`/`createPdf().getBuffer()`). Endpoint
  `GET /api/reports/{inventory|kardex|movements}?format=csv|pdf` protegido por sesión y
  `reports:view`. pdfmake está en `serverExternalPackages`.
- Kardex: `buildKardex` (puro, testeado) calcula saldo corrido; el saldo inicial se obtiene en SQL
  sumando los movimientos anteriores al rango. Una transferencia no altera el saldo global pero sí
  el de cada almacén (`movementEffect`).
- Rango de fechas por defecto de kardex y movimientos: últimos 30 días (`normalizeRange`).

## Usuarios, auditoría y API REST (Fase 9)

- **Usuarios** (`src/features/users/`, solo `users:manage`): diálogo único crear/editar
  (`userFormSchema`; la contraseña solo se valida al crear), restablecer contraseña, activar/
  desactivar y claves de API. Reglas puras y testeadas en `lib/rules.ts`: nadie cambia su propio
  rol ni se desactiva a sí mismo, y siempre queda al menos un administrador activo. Contraseñas con
  `passwordSchema` (8-128, letra y número) y bcrypt factor 10.
- **Claves de API**: `users.api_key_hash` (SHA-256) + `api_key_created_at`; `lib/api-key.ts` genera
  `sp_<48 hex>` y la acción devuelve la clave en claro una sola vez (`ApiKeyDialog`). `apiKeyHash`
  y `apiKey` están en la lista de campos sensibles de `serializeSnapshot`.
- Los cambios de rol y las desactivaciones se aplican en el siguiente login (JWT de 8 h); la clave
  de API se invalida al instante. Documentado en `docs/BUSINESS_RULES.md` §12.
- **Auditoría** (`src/features/audit/`, `audit:view`): solo lectura. `AUDIT_ENTITIES` y sus
  etiquetas en `domain.ts`; al auditar una entidad nueva, añadirla ahí y en `resolveEntityLabels`
  (una consulta por tipo de entidad de la página, nunca por fila). `lib/diff.ts` (puro) calcula el
  diff antes/después y omite `updatedAt`.
- **API REST** (`/api/v1`): rutas en `src/app/api/v1/**/route.ts` construidas con `apiRoute()` de
  `src/features/api/handler.ts` (autenticación por `Authorization: Bearer <clave>` o sesión,
  rate limiting 120/min por identidad, permiso y errores `{ error: { code, message, details? } }`).
  Los handlers solo llaman consultas y servicios del dominio (`listProducts`, `createProduct`,
  `runStockMovement`); la lógica compartida entre Server Actions y API vive en
  `src/features/<módulo>/service.ts`. Esquemas de la API en `src/features/api/schemas.ts`
  (estrictos: un parámetro inválido es 400, no cae al default). `ConflictError` (409) extiende
  `BusinessRuleError` (422).
- **OpenAPI**: `public/openapi.yaml` escrito a mano (3.1) y servido en `/openapi.yaml`; `/api-docs`
  lo renderiza con Scalar desde `cdn.jsdelivr.net` (permitido en la CSP). Al añadir o cambiar una
  ruta, actualizar el YAML: `tests/unit/features/api/openapi.test.ts` falla si un path/método
  documentado no existe como Route Handler o viceversa. Guía de uso en `docs/API.md`; decisión en
  `docs/adr/0003-api-rest-y-claves-de-api.md`.

## Tests E2E, CI y pulido (Fase 10)

- **Playwright** (`playwright.config.ts`, `tests/e2e/`): corre contra el build de producción en el
  puerto 3100 (`webServer` arranca `next start`; hay que ejecutar `npm run build` antes) y la base
  local sembrada. `auth.setup.ts` inicia sesión una vez por rol y guarda cookies en
  `tests/e2e/.auth/` (ignorado por git). Los specs crean datos con SKU `E2E-*` y
  `global-teardown.ts` los borra (productos, movimientos, órdenes, stock y auditoría). Un fixture
  automático falla el test si el navegador reporta errores de consola o violaciones de CSP.
  `fixtures.ts` tiene helpers (`selectOption` para Select de shadcn, `pickProduct` para el
  combobox, `createProductViaApi`, `stockByWarehouse`).
- **Capturas del README**: `npm run screenshots` (proyecto `screenshots` de Playwright) escribe en
  `docs/screenshots/`; no forma parte de la suite normal.
- **CI** (`.github/workflows/ci.yml`): job `quality` (lint, formato, tipos, cobertura, build con
  `SKIP_ENV_VALIDATION`) y job `e2e` en `ubuntu-latest` que arranca el PostgreSQL preinstalado en
  el runner (servicio nativo, sin contenedores, respetando la preferencia del usuario), crea la
  base con `psql`, migra, siembra y ejecuta Playwright.
- **Cobertura**: `vitest.config.mts` exige umbrales en la lógica de negocio (`src/features/**/lib`,
  `src/features/api`, `src/lib` salvo integración); `npm run test:coverage` falla si baja del 70 %.
- **CSP en modo estricto** (`next.config.ts`): `'unsafe-eval'` solo con `NODE_ENV=development`.
  Al añadir un recurso externo (CDN, fuente), ampliarla y comprobar con los E2E.
- Versión 1.0.0 en `package.json` y `CHANGELOG.md`. Documentación de cierre: `docs/ARCHITECTURE.md`
  y `CONTRIBUTING.md`.

## Despliegue (Vercel + Supabase, Fase 11)

- Producción en Vercel (import del repo de GitHub, despliegue automático en cada push a `main`) con
  PostgreSQL en Supabase (ADR 0004). `vercel.json` fija
  `buildCommand: npm run db:deploy && npm run build` y la región `iad1` (East US de Supabase).
- Variables en Vercel: `DATABASE_URL` (transaction pooler 6543), `DIRECT_URL` (session pooler
  5432, para `migrate deploy`), `AUTH_SECRET`, `TZ=America/Caracas` (zona horaria del negocio; los
  cortes de fecha, incluidos los del SQL del dashboard, usan la zona del proceso). `AUTH_URL` no
  hace falta (`trustHost`).
- Las funciones serverless solo incluyen archivos trazados: `outputFileTracingIncludes` añade
  `node_modules/pdfkit/js/data/**` (métricas de Helvetica) a la ruta de reportes. Si se añade otra
  dependencia que lea archivos en tiempo de ejecución, registrarla ahí.
- `prepare` es `husky || true` para que la instalación no falle donde husky no está disponible.
- Seed y primera migración se ejecutan desde el equipo local apuntando a Supabase
  (`docs/DEPLOY.md`). El rate limiting en memoria es por instancia en serverless (documentado como
  limitación).
- Para verificar cambios de esquema sin tocar Supabase se puede usar un PostgreSQL portátil en el
  scratchpad (paquete npm `embedded-postgres`, puerto 5433); nunca instalarlo en el sistema.

## Verificaciones antes de commit

Husky ejecuta `lint-staged` (ESLint + Prettier) en `pre-commit` y `commitlint` en `commit-msg`.
