# ADR 0002: Autenticación con Auth.js, sesiones JWT y permisos por rol

- **Estado:** aceptado
- **Fecha:** 2026-09-22

## Contexto

StockPilot necesita autenticación con usuario y contraseña, tres roles (ADMIN, MANAGER, OPERATOR)
y protección de rutas y acciones. No hay proveedor de identidad externo: los usuarios viven en la
tabla `users` y los crea un administrador.

## Decisión

1. **Auth.js v5 (next-auth@beta)** con el proveedor `Credentials`. Es la integración nativa con el
   App Router: `auth()` en Server Components y Server Actions, `handlers` para `/api/auth` y un
   middleware que decodifica la sesión sin tocar la base de datos.
2. **Sesiones JWT** (no de base de datos). El middleware corre en el runtime Edge, donde el driver
   de SQL Server no está disponible; un JWT firmado con `AUTH_SECRET` permite validar la sesión y
   el rol en cada petición sin consultar la base. Duración: 8 horas.
3. **Configuración dividida**: `auth.config.ts` (sin dependencias de Node, la usa el middleware) y
   `auth.ts` (añade el proveedor con Prisma y bcrypt). Es el patrón recomendado por Auth.js para
   Edge.
4. **Permisos granulares** (`products:manage`, `movements:create`, ...) asignados por rol en una
   matriz estática. Las rutas y el menú se derivan de una única definición de navegación, y cada
   Server Action valida con `requirePermission`. La UI nunca es la única barrera.
5. **bcryptjs** en lugar de `bcrypt` nativo: misma seguridad (mismo algoritmo y factor de costo 10)
   sin compilación de binarios, lo que simplifica la instalación en Windows y en CI.
6. **Rate limiting en memoria** para el login (5 intentos / 15 min por IP + correo). Suficiente
   para una instancia; si se despliega en varias, se sustituye el almacén por Redis manteniendo
   la misma interfaz.

## Consecuencias

- Desactivar un usuario no invalida su JWT hasta que expire (máximo 8 horas). Es un compromiso
  aceptable para este dominio; si fuera crítico, se añadiría una comprobación de `isActive` en el
  layout protegido.
- Los cambios de rol también se reflejan al renovar la sesión, no de inmediato.
- Al añadir un módulo hay que registrar su ruta y permiso en `src/lib/navigation.ts` para que el
  middleware lo proteja y el menú lo muestre.
