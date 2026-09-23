# Requisitos del proyecto StockPilot

Especificación original del producto. Sirve como fuente de verdad para el alcance de cada fase.

## Objetivo

Aplicación web de gestión de inventario con calidad de producción, pensada para que una pequeña
o mediana empresa (tienda, distribuidora o almacén) pueda usarla. Prioriza código limpio,
arquitectura clara, buena experiencia de usuario y documentación completa.

## Stack tecnológico

- Next.js 15 (App Router), React 19, TypeScript estricto
- PostgreSQL (Supabase) con Prisma (provider `postgresql`, migraciones versionadas). Nota: la
  especificación original pedía SQL Server 2022; se migró al desplegar (ver ADR 0004)
- Auth.js (NextAuth v5) con credenciales, bcrypt y sesiones JWT
- Tailwind CSS + shadcn/ui + lucide-react, modo claro/oscuro
- React Hook Form + Zod (esquemas compartidos cliente/servidor)
- TanStack Table (paginación, orden, filtros y búsqueda del lado del servidor)
- Recharts
- Server Actions para mutaciones; Route Handlers solo para API REST pública y exportaciones
- Vitest + Testing Library (unitarios) y Playwright (E2E)
- ESLint, Prettier, Husky + lint-staged
- GitHub Actions (lint, typecheck, tests y build en cada push/PR)

## Roles y permisos (RBAC)

- **ADMIN:** acceso total, gestión de usuarios y configuración.
- **MANAGER:** gestiona productos, proveedores, almacenes, órdenes de compra y reportes.
- **OPERATOR:** registra movimientos de stock y consulta inventario.

Las rutas se protegen con middleware y los permisos se validan también en cada Server Action.

## Modelo de datos (mínimo)

- **User:** id, name, email, passwordHash, role, isActive, timestamps
- **Category:** id, name, description
- **Supplier:** id, name, contactName, email, phone, address, taxId, isActive
- **Warehouse:** id, name, code, address, isActive
- **Product:** id, sku único, barcode, name, description, categoryId, supplierId, unit, costPrice,
  salePrice, avgCost, minStock, maxStock, imageUrl, isActive, timestamps
- **Stock:** productId, warehouseId, quantity (clave compuesta única)
- **StockMovement:** id, type (IN | OUT | ADJUSTMENT | TRANSFER), productId, fromWarehouseId,
  toWarehouseId, quantity, unitCost, reason, reference, userId, createdAt
- **PurchaseOrder:** id, code, supplierId, warehouseId, status (DRAFT | SENT | PARTIALLY_RECEIVED
  | RECEIVED | CANCELLED), expectedDate, notes, createdById, timestamps
- **PurchaseOrderItem:** id, purchaseOrderId, productId, quantityOrdered, quantityReceived, unitCost
- **AuditLog:** id, userId, action, entity, entityId, before JSON, after JSON, createdAt

Decimal para montos, índices en campos de búsqueda frecuente (sku, name, createdAt) y soft delete
(isActive) en catálogos.

## Reglas de negocio críticas

- Todo cambio de stock ocurre solo mediante un StockMovement dentro de una transacción
  (`prisma.$transaction`), actualizando Stock y registrando el movimiento de forma atómica.
- No se permite stock negativo: salidas o transferencias que excedan la existencia se rechazan
  con un mensaje claro.
- Las transferencias generan salida en el almacén origen y entrada en el destino en la misma
  transacción.
- Recibir una orden de compra (total o parcial) genera movimientos IN automáticamente y actualiza
  su estado.
- Alerta de stock bajo cuando quantity <= minStock.
- Toda creación, edición o eliminación queda registrada en AuditLog.
- Valorización del inventario con costo promedio ponderado.

## Módulos y pantallas

1. Login con usuarios demo por rol visibles en pantalla.
2. Dashboard: KPIs (valor total del inventario, productos activos, productos con stock bajo,
   movimientos del día), gráfica de movimientos de 30 días, top 10 productos por valor, últimos
   movimientos.
3. Productos: listado con búsqueda, filtros por categoría/proveedor/estado, CRUD, detalle con
   stock por almacén e historial de movimientos.
4. Categorías, proveedores y almacenes: CRUD completo.
5. Movimientos: entrada, salida, ajuste y transferencia; historial filtrable por fecha, tipo,
   producto, almacén y usuario.
6. Órdenes de compra: crear, enviar, recibir parcial/total, cancelar.
7. Alertas: productos bajo mínimo con acción rápida "crear orden de compra".
8. Reportes: inventario valorizado, kardex por producto, movimientos por rango de fechas;
   exportación a CSV y PDF.
9. Usuarios (solo ADMIN): crear, editar rol, activar/desactivar.
10. Auditoría (solo ADMIN): bitácora filtrable.

## API REST pública

Route Handlers en `/api/v1` para productos, stock y movimientos, con validación Zod, paginación,
códigos HTTP correctos y respuestas de error consistentes. Documentada con OpenAPI 3
(`openapi.yaml`) y una página `/api-docs`.

## Calidad y UX

- Diseño profesional y responsivo, sidebar colapsable, breadcrumbs.
- Skeletons, estados vacíos, `error.tsx` y `not-found.tsx`.
- Toasts en cada acción y diálogos de confirmación para acciones destructivas.
- Accesibilidad: etiquetas, foco visible, navegación por teclado, contraste adecuado.
- Manejo de errores centralizado; nunca exponer errores internos de SQL.
- Variables de entorno validadas con Zod; `.env.example` incluido.
- Seguridad: hash de contraseñas, protección de rutas, validación en servidor, cabeceras de
  seguridad, rate limiting en login.

## Formato regional

- Fechas en formato sudamericano: `dd/MM/yyyy`.
- Moneda: dólares estadounidenses (USD).

## Datos de prueba

Seed con 3 usuarios (uno por rol), 8 categorías, 10 proveedores, 3 almacenes, 150 productos y
~500 movimientos en los últimos 90 días.

## Testing

- Unitarios para reglas de negocio (movimientos, stock negativo, costo promedio, permisos) y
  esquemas Zod.
- E2E con Playwright: login, crear producto, registrar entrada y salida, transferir entre
  almacenes, recibir orden de compra.
- Cobertura objetivo >= 70 % en la capa de lógica de negocio.

## Documentación obligatoria

README profesional, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/BUSINESS_RULES.md`,
`docs/API.md` + `openapi.yaml`, `docs/adr/`, `CONTRIBUTING.md`, `CHANGELOG.md` y JSDoc en
funciones públicas.
