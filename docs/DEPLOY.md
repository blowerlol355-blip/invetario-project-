# Despliegue en Vercel con Azure SQL Database

La aplicación se despliega en **Vercel** (Next.js) y la base de datos en **Azure SQL Database**,
que es SQL Server gestionado: el esquema, las migraciones y el código funcionan sin cambios.
Vercel despliega automáticamente cada push a `main` y crea un entorno de vista previa por
cada pull request.

## 1. Base de datos en Azure

1. En [portal.azure.com](https://portal.azure.com) crea un recurso **SQL Database**. Si tu
   suscripción lo permite, elige la **oferta gratuita** (General Purpose serverless, 32 GB,
   100 000 vCore-segundos al mes).
2. Servidor nuevo: nombre `stockpilot-sql` (el host será `stockpilot-sql.database.windows.net`),
   región **East US** (la más cercana a la región `iad1` de Vercel configurada en `vercel.json`),
   autenticación **SQL** con un usuario administrador y una contraseña fuerte.
3. Base de datos: `stockpilot`. Intercalación por defecto (`SQL_Latin1_General_CP1_CI_AS`).
4. En **Networking** del servidor:
   - Activa **Allow Azure services and resources to access this server**.
   - Añade una regla con tu IP actual (para migrar y sembrar desde tu equipo).
   - Vercel no tiene IPs fijas en el plan gratuito: añade una regla `0.0.0.0` – `255.255.255.255`
     (nombre `vercel`). La protección real es la contraseña y TLS obligatorio; si más adelante
     usas un plan con IPs dedicadas de Vercel, sustituye la regla por esas IPs.
5. Si elegiste la oferta gratuita, en **Compute + storage** revisa el comportamiento al agotar
   el crédito mensual (pausar o seguir cobrando) y el **auto-pause**: la primera petición tras una
   pausa puede tardar hasta un minuto.

Cadena de conexión (formato de Prisma):

```
sqlserver://stockpilot-sql.database.windows.net:1433;database=stockpilot;user=USUARIO;password=CONTRASEÑA;encrypt=true
```

En Azure el certificado es válido: **no** añadas `trustServerCertificate=true`. Si la contraseña
contiene `;` o `=`, enciérrala entre llaves: `password={mi;clave}`.

## 2. Migraciones y datos iniciales (desde tu equipo)

```powershell
$env:DATABASE_URL = "sqlserver://stockpilot-sql.database.windows.net:1433;database=stockpilot;user=USUARIO;password=CONTRASEÑA;encrypt=true"
npm run db:deploy   # aplica las migraciones de prisma/migrations
npm run db:seed     # usuarios demo, catálogos, productos y movimientos
```

`db:deploy` también se ejecuta en cada build de Vercel (ver `vercel.json`), así que las
migraciones futuras se aplican solas al hacer push. El seed se ejecuta una sola vez.

> Los usuarios demo tienen contraseñas públicas (aparecen en la pantalla de login). Para un
> entorno real cámbialas desde _Usuarios → Restablecer contraseña_ después del primer acceso.

## 3. Proyecto en Vercel

1. En [vercel.com/new](https://vercel.com/new) importa el repositorio
   `blowerlol355-blip/invetario-project-`. Vercel detecta Next.js; deja el directorio raíz por
   defecto. `vercel.json` ya fija el comando de build y la región.
2. En **Environment Variables** añade (para Production y Preview):

   | Variable       | Valor                                           |
   | -------------- | ----------------------------------------------- |
   | `DATABASE_URL` | La cadena de conexión de Azure del paso 1       |
   | `AUTH_SECRET`  | Un secreto aleatorio: `openssl rand -base64 32` |
   | `TZ`           | `America/Caracas` (zona horaria del negocio)    |

   `AUTH_URL` no es necesaria: Auth.js usa la URL del despliegue (`trustHost`).

3. Pulsa **Deploy**. El build ejecuta `prisma generate` (postinstall), `prisma migrate deploy` y
   `next build`. Al terminar, abre la URL, entra con `admin@stockpilot.dev` y revisa el
   dashboard, un PDF de reportes y `/api-docs`.

## 4. Qué tener en cuenta en serverless

- **Rate limiting en memoria**: cada instancia de función lleva su propio contador; en Vercel el
  límite es por instancia, no global. Suficiente para una demo; para producción real, respaldarlo
  en un almacén compartido (Redis) usando la misma interfaz de `src/lib/rate-limit.ts`.
- **Zona horaria**: los cortes de día (dashboard, kardex, movimientos por fecha) usan la hora del
  servidor; por eso se fija `TZ`. La agrupación diaria del dashboard se hace en SQL sobre la
  fecha UTC almacenada, de modo que un movimiento registrado después de las 20:00 (UTC-4) cae en
  el día siguiente de la gráfica.
- **Arranque en frío**: la primera petición tras inactividad tarda unos segundos (función +
  conexión a Azure SQL). Si la base está en auto-pause, puede ser más.
- **PDF**: pdfmake se ejecuta sin empaquetar (`serverExternalPackages`) y las métricas de las
  fuentes estándar se incluyen en la función con `outputFileTracingIncludes`.
- **CSP**: la política estricta ya incluye los orígenes de Scalar (`/api-docs`). No hace falta
  añadir nada para Vercel.

## 5. Solución de problemas

| Síntoma                                                                     | Causa probable y solución                                                                                                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install` falla con `Cannot resolve environment variable: DATABASE_URL` | Versión anterior de `prisma.config.ts`; desde 1.0.1 `prisma generate` no exige la variable. Aun así, `DATABASE_URL` debe existir en Vercel para `migrate deploy`. |
| Build falla en `prisma migrate deploy` con error de conexión                | Regla de firewall ausente en Azure o `DATABASE_URL` incorrecta en Vercel.                                                                                         |
| `Login failed for user`                                                     | Usuario o contraseña con caracteres especiales sin llaves `{}` en la cadena.                                                                                      |
| Primera carga muy lenta o error 500 tras horas sin uso                      | Auto-pause de Azure SQL: reintenta; o desactiva el auto-pause en Compute + storage.                                                                               |
| El PDF devuelve 500 en Vercel pero funciona en local                        | Verifica que `outputFileTracingIncludes` siga apuntando a `node_modules/pdfkit/js/data/**`.                                                                       |
| Fechas del dashboard desplazadas un día                                     | Falta la variable `TZ` en Vercel.                                                                                                                                 |
