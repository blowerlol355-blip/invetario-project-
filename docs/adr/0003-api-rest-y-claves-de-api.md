# ADR 0003: API REST pública con claves de API por usuario

- **Estado:** aceptado
- **Fecha:** 2026-09-23

## Contexto

StockPilot expone una API REST (`/api/v1`) para productos, stock y movimientos. Los requisitos
piden validación con Zod, paginación, códigos HTTP correctos, errores consistentes y documentación
OpenAPI, pero no fijan el mecanismo de autenticación. Los movimientos exigen un `userId` (quién
registró el cambio) y toda escritura se audita, así que la API necesita una identidad real, no un
secreto anónimo compartido.

## Decisión

1. **Claves de API por usuario.** Un administrador genera desde _Usuarios_ una clave
   `sp_<48 hex>` (24 bytes aleatorios) para cualquier cuenta. En `users.api_key_hash` se guarda solo
   su SHA-256; la clave en claro se muestra una vez. La clave hereda los permisos del rol y se
   invalida al revocarla, regenerarla o desactivar la cuenta. Así cada movimiento y cada entrada de
   auditoría creados por la API quedan atribuidos a una persona.
2. **Sesión del navegador como alternativa.** Sin cabecera `Authorization`, la API acepta la cookie
   de Auth.js. Permite "probar" desde `/api-docs` con la sesión abierta sin crear claves.
3. **Un único envoltorio (`apiRoute`)** en `src/features/api/handler.ts` que autentica, aplica rate
   limiting (120 req/min por identidad, 30 fallos de autenticación/min por IP), comprueba el permiso
   y mapea excepciones a `{ error: { code, message, details? } }`. Los Route Handlers solo componen
   consultas y servicios del dominio existentes; ninguna regla de negocio vive en la API.
4. **Validación estricta.** A diferencia de los formularios (donde un parámetro inválido cae al
   valor por defecto), en la API los parámetros inválidos responden `400` con detalle por campo. El
   cuerpo de movimientos usa `.strict()` para rechazar claves desconocidas.
5. **Especificación escrita a mano** en `public/openapi.yaml` (OpenAPI 3.1) y renderizada con
   Scalar desde CDN en `/api-docs`. Un test comprueba que cada path/método documentado exista como
   Route Handler y viceversa, para que la documentación no se desincronice.

## Alternativas consideradas

- **Secreto único en `.env`** (`API_KEY`): trivial, pero sin atribución por usuario ni revocación
  individual; obligaría a un usuario "sistema" para los movimientos.
- **Tabla `api_keys` con varias claves por usuario y caducidad**: más flexible, pero añade una
  entidad y UI para un caso que hoy no existe. La columna en `users` cubre el requisito y se puede
  migrar a una tabla sin cambiar la API.
- **OAuth 2 / JWT de cliente**: sobredimensionado para integraciones servidor a servidor de una
  PyME.
- **Generar OpenAPI desde los esquemas Zod** (`zod-to-openapi`): evitaría duplicar tipos, pero la
  salida es menos legible y requiere anotar cada esquema; el test de coherencia mitiga el riesgo de
  desincronización.

## Consecuencias

- Las rutas `/api/v1` y `/api-docs` son públicas en el middleware; la autenticación la resuelve el
  propio envoltorio en cada petición.
- La CSP (aún en modo report-only) admite `cdn.jsdelivr.net` y `fonts.scalar.com` para la página
  de documentación.
- El rate limiting es en memoria: válido para una instancia; con varias se respalda en Redis con la
  misma interfaz (`src/lib/rate-limit.ts`).
