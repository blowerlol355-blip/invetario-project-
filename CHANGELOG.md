# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto
adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.0.0] - 2026-09-23

Primera versión completa: los diez módulos del proyecto, la API REST y la documentación final.

### Added

- Tests E2E con Playwright (login y permisos, alta de producto, entrada/salida/transferencia, recepción de orden de compra) con limpieza automática de datos y verificación de que no hay violaciones de CSP.
- Integración continua en GitHub Actions: lint, formato, tipos, tests con cobertura y build; job E2E con SQL Server 2022 instalado de forma nativa en el runner.
- Documentación final: `docs/ARCHITECTURE.md`, `CONTRIBUTING.md`, capturas de pantalla en el README y umbral de cobertura para la lógica de negocio.

### Changed

- La Content Security Policy pasa de modo report-only a modo estricto (`'unsafe-eval'` solo en desarrollo).
- Eliminados los SVG del scaffold inicial en `public/`.

- Gestión de usuarios (solo ADMIN): crear, editar rol, restablecer contraseña, activar/desactivar y generar o revocar claves de API, con reglas que impiden dejar el sistema sin administradores.
- Bitácora de auditoría filtrable por entidad, acción, usuario, fechas y texto, con detalle que muestra el diff campo a campo.
- API REST pública `/api/v1` (productos, stock y movimientos) con autenticación por clave de API o sesión, validación Zod, paginación, errores uniformes y rate limiting; especificación `openapi.yaml`, página `/api-docs` (Scalar) y `docs/API.md`.

- Dashboard con KPIs (valor del inventario, productos activos, stock bajo, movimientos del día), gráfica de entradas y salidas de 30 días, top 10 de productos por valor y últimos movimientos.
- Reportes de inventario valorizado, kardex por producto y movimientos por fecha, con exportación a CSV y PDF.

- Órdenes de compra: creación con ítems dinámicos, edición de borradores, envío, recepción parcial o total que genera entradas de stock, cancelación, listado filtrable y detalle con línea de tiempo.
- Módulo de alertas de stock bajo con cantidad sugerida, indicador de órdenes abiertas y acción rápida para crear una orden de compra.
- Permiso `purchase-orders:receive` y helper de transacción serializable con reintentos.

- Servicio transaccional de movimientos de stock (entrada, salida, ajuste y transferencia) con bloqueo de stock negativo mediante actualización condicional, costo promedio ponderado y reintentos ante conflictos de concurrencia.
- Formulario de registro de movimientos con selector de producto, resumen de existencias antes y después, e historial filtrable por tipo, almacén, usuario, fechas y texto.
- Documentación de reglas de negocio (`docs/BUSINESS_RULES.md`).

- Módulo de productos: listado con búsqueda, filtros por categoría, proveedor y estado, formulario completo con margen en vivo, y página de detalle con KPIs, stock por almacén e historial de movimientos.
- Reglas de producto: SKU y código de barras únicos, referencias activas y bloqueo de desactivación con existencias; rutas de creación y edición protegidas en el middleware.

- CRUD de categorías, proveedores y almacenes con soft delete, reglas de negocio, auditoría transaccional y diálogos de confirmación.
- Tabla genérica con paginación, orden, búsqueda y filtro de estado del lado del servidor (estado en la URL).
- Infraestructura de Server Actions: resultado uniforme, mapeo seguro de errores (Zod, Prisma, negocio) y helper de auditoría.

- Autenticación con Auth.js v5 (credenciales, bcrypt, JWT), pantalla de login con usuarios demo y rate limiting.
- Matriz de permisos por rol, middleware de protección de rutas y guards para Server Actions.
- Layout principal: sidebar colapsable, header con breadcrumbs, menú de usuario, páginas de error, 404 y acceso denegado.

- Esquema completo de base de datos (usuarios, categorías, proveedores, almacenes, productos, stock, movimientos, órdenes de compra y auditoría) con migración inicial y constraints CHECK.
- Constantes de dominio tipadas (`src/lib/domain.ts`) y cálculo de costo promedio ponderado con tests.
- Seed determinista con 150 productos, ~540 movimientos en 90 días, órdenes de compra en todos los estados y usuarios demo.
- Documentación de base de datos (`docs/DATABASE.md`) con diagrama entidad-relación.

- Configuración inicial del proyecto: Next.js 15, React 19, TypeScript estricto, Tailwind CSS v4 y shadcn/ui.
- Tema claro/oscuro con paleta propia, animaciones y página de bienvenida.
- Calidad de código: ESLint, Prettier, Husky, lint-staged y commitlint (Conventional Commits).
- Prisma 7 con provider `sqlserver`, driver adapter y migración inicial.
- Script `db:create` que crea la base de datos en la instancia local de SQL Server 2022.
- Validación de variables de entorno con Zod y cabeceras de seguridad HTTP.
- Vitest + Testing Library con tests de humo.
