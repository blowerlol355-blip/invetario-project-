# Reglas de negocio del inventario

Este documento describe las reglas que gobiernan el inventario de StockPilot y dónde se aplican en
el código. Toda regla se valida en el servidor; la interfaz solo anticipa el resultado.

## 1. El stock solo cambia mediante movimientos

La tabla `stocks` (existencia por producto y almacén) **nunca se edita directamente**. La única
función que la modifica es `applyStockMovement` (`src/features/stock/lib/apply-movement.ts`), que
recibe una orden de movimiento y, dentro de una transacción:

1. Valida la estructura de la orden (tipo, almacenes, cantidad, costo).
2. Comprueba que el producto y los almacenes existan y estén activos.
3. Resta en el almacén de origen y/o suma en el de destino.
4. Recalcula el costo promedio si es una entrada.
5. Inserta el registro en `stock_movements`.

Si cualquier paso falla, la transacción se revierte y no queda rastro parcial. Las órdenes de
compra (Fase 7) reutilizan esta misma función para generar sus entradas.

`runStockMovement` (`run-movement.ts`) envuelve la función en una transacción con aislamiento
**Serializable**, registra la entrada de auditoría y reintenta hasta tres veces ante conflictos
de concurrencia detectados por SQL Server.

## 2. Tipos de movimiento

La cantidad siempre es positiva; el sentido lo dan los almacenes. Un constraint `CHECK` en la base
de datos exige la misma combinación.

| Tipo         | Origen (`from`) | Destino (`to`) | Efecto                                          |
| ------------ | --------------- | -------------- | ----------------------------------------------- |
| `IN`         | no              | sí             | Suma en destino. Exige costo unitario.          |
| `OUT`        | sí              | no             | Resta en origen.                                |
| `TRANSFER`   | sí              | sí (distinto)  | Resta en origen y suma en destino, atómicamente |
| `ADJUSTMENT` | uno de los dos  |                | Aumenta (`to`) o disminuye (`from`) existencia  |

Los ajustes exigen un motivo (conteo físico, merma, daño, corrección).

## 3. No se permite stock negativo

Antes de restar se comprueba la existencia y se devuelve un mensaje claro:

> Stock insuficiente en Almacén Central: hay 12 unidad y se intenta retirar 15.

Además, la resta se ejecuta como una **actualización condicional** (`quantity >= cantidad`). Si dos
usuarios registran salidas del mismo producto al mismo tiempo y la segunda ya no cabe, la base de
datos no la aplica y el movimiento se rechaza con: "El stock cambió mientras se registraba el
movimiento. Vuelve a intentarlo." Un `CHECK (quantity >= 0)` en `stocks` es la última barrera.

## 4. Transferencias atómicas

Una transferencia genera un único movimiento `TRANSFER` que resta en el origen y suma en el
destino dentro de la misma transacción. Si el origen no tiene existencia suficiente, no se
modifica ningún almacén.

## 5. Costo promedio ponderado

Cada entrada (`IN`) recalcula `Product.avgCost` con la existencia total del producto (todos los
almacenes):

```
nuevo promedio = (existencia × promedio actual + cantidad entrante × costo unitario)
                 / (existencia + cantidad entrante)
```

Si no hay existencia previa, el promedio pasa a ser el costo de la entrada. Salidas, ajustes y
transferencias no alteran el promedio. La implementación única es `calculateWeightedAverageCost`
(`src/features/stock/lib/average-cost.ts`), compartida por el seed y el servicio de movimientos.
`Product.costPrice` es un costo de referencia de catálogo y no cambia con los movimientos.

La **valorización del inventario** es `sum(existencia × avgCost)` por producto.

## 6. Alertas de stock bajo

Un producto está en alerta cuando su existencia total es **menor o igual** a `minStock`. Estados
derivados (`getStockStatus`): sin stock (0), bajo (`<= minStock`), normal, y sobre máximo
(`> maxStock` cuando está definido). El módulo de alertas (Fase 7) lista los productos en alerta y
permite crear una orden de compra desde ahí.

## 7. Órdenes de compra

- Ciclo de vida: `DRAFT -> SENT -> PARTIALLY_RECEIVED -> RECEIVED`, o `CANCELLED` desde borrador o
  enviada.
- Recibir una orden (total o parcialmente) genera un movimiento `IN` por cada ítem recibido, con
  el costo unitario del ítem y `reference = código de la orden`, dentro de la misma transacción que
  actualiza `quantity_received` y el estado.
- No se puede recibir más de lo pedido ni recibir una orden cancelada.

## 8. Catálogos y soft delete

Usuarios, categorías, proveedores, almacenes y productos nunca se borran físicamente: se
desactivan (`isActive = false`). Restricciones al desactivar:

| Entidad   | No se puede desactivar si...                                   |
| --------- | -------------------------------------------------------------- |
| Categoría | tiene productos activos                                        |
| Proveedor | tiene órdenes de compra abiertas (borrador, enviada o parcial) |
| Almacén   | tiene existencias                                              |
| Producto  | tiene existencias                                              |

Un producto inactivo no admite movimientos; un almacén inactivo no puede ser origen ni destino.

## 9. Unicidad

- `sku` de producto, `code` de almacén, `name` de categoría y `email` de usuario: índice único en
  la base de datos.
- `barcode` de producto y `taxId` de proveedor: opcionales; se validan como únicos en la
  aplicación porque SQL Server no admite varios `NULL` en un índice único.

## 10. Permisos

Toda Server Action valida el permiso con `requirePermission` y el middleware protege las rutas.

| Acción                                             | ADMIN | MANAGER | OPERATOR |
| -------------------------------------------------- | :---: | :-----: | :------: |
| Ver dashboard, productos, movimientos y alertas    |  sí   |   sí    |    sí    |
| Registrar movimientos                              |  sí   |   sí    |    sí    |
| Gestionar productos, catálogos y órdenes de compra |  sí   |   sí    |    no    |
| Ver reportes                                       |  sí   |   sí    |    no    |
| Gestionar usuarios y ver auditoría                 |  sí   |   no    |    no    |

La API REST (`/api/v1`) aplica la misma matriz: cada ruta declara su permiso y la clave de API
hereda el rol del usuario (ver `docs/API.md`).

## 11. Auditoría

Toda creación, edición, desactivación y cambio de estado se registra en `audit_logs` dentro de la
misma transacción que el cambio, con snapshots JSON `before`/`after` sin campos sensibles
(`passwordHash`, `apiKeyHash`). Los movimientos de stock se auditan como `CREATE` de
`StockMovement` con las existencias resultantes. La bitácora es de solo lectura: ninguna acción
modifica ni borra entradas. Solo ADMIN la consulta (`/audit`), con filtros por entidad, acción,
usuario, fechas y texto, y un detalle que muestra el diff campo a campo.

## 12. Usuarios y claves de API

- Solo ADMIN gestiona usuarios (`users:manage`): crear, editar nombre/correo/rol, restablecer
  contraseña, activar/desactivar y generar/revocar claves de API.
- Contraseñas de 8 a 128 caracteres con al menos una letra y un número; hash bcrypt (factor 10).
- Un administrador **no puede cambiar su propio rol ni desactivar su propia cuenta**.
- **Siempre debe quedar al menos un administrador activo**: no se degrada ni se desactiva al
  último.
- Desactivar un usuario impide nuevos inicios de sesión y anula su clave de API de inmediato. Una
  sesión JWT ya abierta sigue válida hasta caducar (máximo 8 horas); lo mismo ocurre con un cambio
  de rol.
- La clave de API (`sp_` + 48 hex) se muestra una sola vez; en la base solo se guarda su SHA-256.
  Regenerarla invalida la anterior. Cada usuario tiene como máximo una clave.
- El historial (movimientos, órdenes, auditoría) de un usuario desactivado se conserva; nunca se
  borra un usuario.
