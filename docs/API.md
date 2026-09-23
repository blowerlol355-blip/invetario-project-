# API REST de StockPilot (v1)

Referencia interactiva: **`/api-docs`** (Scalar sobre `public/openapi.yaml`, OpenAPI 3.1).
Este documento resume cómo autenticarse, el formato de las respuestas y los endpoints.

## Autenticación

Todas las rutas de `/api/v1` exigen identidad. Hay dos mecanismos:

| Mecanismo            | Cómo                                | Para quién                              |
| -------------------- | ----------------------------------- | --------------------------------------- |
| Clave de API         | `Authorization: Bearer sp_<48 hex>` | Integraciones, scripts, otros sistemas  |
| Sesión del navegador | Cookie de Auth.js (automática)      | Probar desde `/api-docs` estando logado |

Un administrador genera la clave desde **Usuarios → ⋯ → Generar clave de API**. La clave se
muestra **una sola vez**; en la base solo se guarda su hash SHA-256. Regenerarla invalida la
anterior y **Revocar** la elimina. La clave hereda los permisos del rol del usuario, y una cuenta
desactivada deja de autenticarse aunque tenga clave.

```bash
curl -H "Authorization: Bearer sp_..." http://localhost:3000/api/v1/me
```

## Formato de respuestas

- Recurso simple: `{ "data": { ... } }`
- Listado: `{ "data": [ ... ], "meta": { "page", "pageSize", "total", "pageCount" } }`
- Error: `{ "error": { "code", "message", "details"?: [{ "path", "message" }] } }`

Todas las respuestas llevan `Cache-Control: no-store`. Fechas en ISO 8601 (UTC); importes en
USD como números.

### Códigos de error

| HTTP | `code`             | Cuándo                                                   |
| ---- | ------------------ | -------------------------------------------------------- |
| 400  | `VALIDATION_ERROR` | Query o cuerpo inválidos (`details` indica cada campo)   |
| 400  | `BAD_REQUEST`      | Cuerpo que no es JSON                                    |
| 401  | `UNAUTHORIZED`     | Sin clave/sesión, clave revocada o cuenta desactivada    |
| 403  | `FORBIDDEN`        | El rol no tiene el permiso de la ruta                    |
| 404  | `NOT_FOUND`        | El recurso no existe                                     |
| 409  | `CONFLICT`         | SKU o código de barras duplicado                         |
| 422  | `BUSINESS_RULE`    | Regla de negocio (stock insuficiente, almacén inactivo…) |
| 429  | `RATE_LIMITED`     | Más de 120 peticiones/minuto (`Retry-After` en segundos) |
| 500  | `INTERNAL_ERROR`   | Error no controlado (nunca expone detalles internos)     |

### Paginación

`page` (≥ 1) y `pageSize` (1–100, 20 por defecto). Los valores fuera de rango responden 400, no
se corrigen en silencio como en la interfaz.

### Límite de peticiones

120 peticiones por minuto por identidad, informadas en `X-RateLimit-Limit` y
`X-RateLimit-Remaining`. Los intentos fallidos de autenticación se limitan a 30 por minuto y por
IP. El contador vive en memoria (una instancia); con varias instancias se respaldaría en Redis.

## Endpoints

| Método | Ruta                    | Permiso            | Descripción                                       |
| ------ | ----------------------- | ------------------ | ------------------------------------------------- |
| GET    | `/api/v1/me`            | autenticado        | Identidad y permisos de la petición               |
| GET    | `/api/v1/products`      | `products:read`    | Listado con `q`, `status`, categoría, proveedor   |
| POST   | `/api/v1/products`      | `products:manage`  | Crear producto (201 + `Location`)                 |
| GET    | `/api/v1/products/{id}` | `products:read`    | Detalle con existencia por almacén                |
| PUT    | `/api/v1/products/{id}` | `products:manage`  | Actualizar producto                               |
| GET    | `/api/v1/stock`         | `products:read`    | Existencias por producto y almacén                |
| GET    | `/api/v1/movements`     | `movements:read`   | Historial con filtros por tipo, fechas, etc.      |
| POST   | `/api/v1/movements`     | `movements:create` | Registrar entrada, salida, ajuste o transferencia |

Permisos por rol: OPERATOR lee productos y stock y registra movimientos; MANAGER y ADMIN además
crean y editan productos. La matriz completa está en `src/lib/permissions.ts`.

### Registrar un movimiento

El cuerpo sigue la convención de la base (`quantity` siempre > 0; el sentido lo dan los almacenes):

| `type`       | `fromWarehouseId`                    | `toWarehouseId` | `unitCost`  |
| ------------ | ------------------------------------ | --------------- | ----------- |
| `IN`         | —                                    | obligatorio     | obligatorio |
| `OUT`        | obligatorio                          | —               | ignorado    |
| `TRANSFER`   | obligatorio                          | obligatorio     | ignorado    |
| `ADJUSTMENT` | uno de los dos (from resta, to suma) | ignorado        |

```bash
curl -X POST http://localhost:3000/api/v1/movements \
  -H "Authorization: Bearer sp_..." \
  -H "Content-Type: application/json" \
  -d '{"type":"IN","productId":"<uuid>","toWarehouseId":"<uuid>","quantity":10,"unitCost":12.5,"reference":"FAC-0001"}'
```

Respuesta `201`:

```json
{
  "data": {
    "movementId": "…",
    "productId": "…",
    "newAverageCost": 12.31,
    "balances": [{ "warehouseId": "…", "quantity": 42 }]
  }
}
```

La API usa exactamente el mismo servicio que la interfaz (`applyStockMovement`): stock nunca
negativo, transferencias atómicas, costo promedio ponderado y auditoría en la misma transacción.

### Crear un producto

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer sp_..." \
  -H "Content-Type: application/json" \
  -d '{"sku":"HER-9001","name":"Taladro percutor 800W","categoryId":"<uuid>","unit":"unidad","costPrice":45.5,"salePrice":79.9,"minStock":5}'
```

Campos opcionales (`barcode`, `description`, `supplierId`, `imageUrl`, `maxStock`) pueden omitirse.
El SKU se guarda en mayúsculas y debe ser único (409 si ya existe).

## Implementación

- `src/features/api/handler.ts`: `apiRoute()` autentica, aplica rate limiting, comprueba el
  permiso y convierte cualquier excepción (Zod, Prisma, reglas de negocio) en el formato de error
  uniforme. `parseQuery` / `parseBody` validan con los esquemas de `src/features/api/schemas.ts`.
- `src/features/api/auth.ts`: resuelve la identidad por clave (hash SHA-256 en `users.api_key_hash`)
  o por sesión.
- Las rutas viven en `src/app/api/v1/**/route.ts` y reutilizan las consultas y servicios del
  dominio (`listProducts`, `createProduct`, `runStockMovement`…), nunca duplican reglas.
- `tests/unit/features/api/openapi.test.ts` comprueba que cada path y método de `openapi.yaml`
  exista como Route Handler, y viceversa.
