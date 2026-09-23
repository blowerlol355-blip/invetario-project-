# ADR 0004: Migración de SQL Server a PostgreSQL (Supabase)

- **Estado:** aceptado (sustituye la fila "Base de datos" y las consecuencias del ADR 0001)
- **Fecha:** 2026-09-23

## Contexto

Las fases 1 a 10 se construyeron sobre SQL Server 2022 local y el despliegue previsto era Vercel
con Azure SQL Database. Al desplegar, la oferta gratuita de Azure resultó un obstáculo (alta de
suscripción y tarjeta) y el autor pidió alojar la base en Supabase, que ofrece PostgreSQL
gestionado con plan gratuito sin tarjeta. Supabase es PostgreSQL, así que el cambio implica
cambiar el motor de toda la aplicación, no solo la cadena de conexión.

## Decisión

Migrar el proyecto a **PostgreSQL** con **Prisma 7** (`provider = "postgresql"`) y el driver
adapter `@prisma/adapter-pg`, usando **Supabase** tanto en producción como en desarrollo local
(sin instalar nada en el equipo del autor y sin contenedores, que sigue siendo una preferencia
firme).

Alcance del cambio:

- `schema.prisma`: provider `postgresql`; `NVarChar(n)` → `VarChar(n)`, `NVarChar(Max)` → `Text`.
  Se conservan las columnas `VARCHAR` con `CHECK` en lugar de enums de Prisma y el JSON serializado
  como texto: `src/lib/domain.ts` sigue siendo la única fuente de valores válidos y el código de
  aplicación no cambia.
- Migraciones: una nueva migración inicial para PostgreSQL (las de SQL Server no son aplicables).
  Como no existía ninguna base de producción, no hay migración de datos.
- SQL crudo (alertas, dashboard, reportes): `ISNULL` → `COALESCE`, `is_active = 1` →
  `is_active`, `OFFSET/FETCH` → `LIMIT/OFFSET`, `TOP` → `LIMIT`, `LIKE` → `ILIKE` y
  `CONVERT(varchar(10), ..., 23)` → `to_char(... AT TIME ZONE ..., 'YYYY-MM-DD')`.
- Búsquedas con Prisma: `contains` es sensible a mayúsculas en PostgreSQL (en SQL Server la
  intercalación por defecto no lo era); todas las búsquedas de texto usan `mode: "insensitive"`.
- Fechas en SQL crudo: los parámetros `Date` se envían como `toISOString()::timestamp` para que
  la comparación sea siempre en UTC, independientemente de la zona de la sesión.
- Conexión: `DATABASE_URL` (pooler de transacciones, puerto 6543, para la app en serverless) y
  `DIRECT_URL` opcional (pooler de sesión, puerto 5432, para migraciones y seed).
  `prisma.config.ts` usa `DIRECT_URL` si existe.
- CI: el job E2E usa el PostgreSQL preinstalado en el runner de Ubuntu (servicio nativo).
- Se elimina `scripts/create-database.ts` (`db:create`): Supabase y CI ya tienen la base creada.

## Consecuencias

- Los índices únicos de PostgreSQL sí admiten varios `NULL`; aun así `barcode` y `taxId` se
  siguen validando en la aplicación para devolver un mensaje de campo claro y mantener las reglas
  en un solo sitio.
- `withSerializableTransaction` no cambia: PostgreSQL reporta los conflictos de serialización
  (`40001`) y los deadlocks como `P2034`, que ya se reintentan.
- La agrupación diaria del dashboard ahora respeta la zona horaria del proceso (`TZ`), lo que
  elimina la limitación documentada de "movimientos después de las 20:00 caen en el día siguiente".
- El portafolio deja de demostrar SQL Server; a cambio el despliegue es gratuito y sin fricción.
  El ADR 0001 se mantiene como registro histórico.
