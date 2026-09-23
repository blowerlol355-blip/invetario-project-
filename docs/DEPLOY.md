# Despliegue en Vercel con Supabase (PostgreSQL)

La aplicación se despliega en **Vercel** (Next.js) y la base de datos en **Supabase**
(PostgreSQL gestionado, plan gratuito sin tarjeta). Vercel despliega automáticamente cada push a
`main` y crea un entorno de vista previa por cada pull request. El desarrollo local también
apunta a Supabase: no hace falta instalar ninguna base de datos en el equipo.

## 1. Proyecto en Supabase

1. En [supabase.com/dashboard](https://supabase.com/dashboard) crea un proyecto nuevo:
   nombre `stockpilot`, una **contraseña de base de datos** fuerte (guárdala: es la del usuario
   `postgres`) y región **East US (North Virginia)**, la más cercana a la región `iad1` de Vercel
   fijada en `vercel.json`.
2. Cuando el proyecto esté listo, pulsa **Connect** (arriba) y copia las dos cadenas de la
   pestaña _ORMs → Prisma_ (o de _Connection string_):

   | Cadena                 | Puerto | Uso                                                                |
   | ---------------------- | ------ | ------------------------------------------------------------------ |
   | **Transaction pooler** | 6543   | `DATABASE_URL` en Vercel (serverless, muchas conexiones cortas)    |
   | **Session pooler**     | 5432   | `DIRECT_URL` en Vercel (migraciones) y `DATABASE_URL` en tu equipo |

   Ambas tienen la forma
   `postgresql://postgres.REF:CONTRASEÑA@aws-0-REGION.pooler.supabase.com:PUERTO/postgres`.
   No uses la _Direct connection_ (`db.REF.supabase.co`): solo acepta IPv6.

3. Si la contraseña contiene caracteres como `@`, `#`, `/` o `%`, codifícala en la URL
   (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `%` → `%25`).

Supabase no necesita reglas de firewall: el acceso se controla con la contraseña y TLS.

## 2. Migraciones y datos iniciales (desde tu equipo)

En `.env` pon la cadena del **session pooler** como `DATABASE_URL` y ejecuta:

```powershell
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
2. En **Settings → Environment Variables** añade, marcadas para **Production** y **Preview**:

   | Variable       | Valor                                           |
   | -------------- | ----------------------------------------------- |
   | `DATABASE_URL` | Cadena del **transaction pooler** (puerto 6543) |
   | `DIRECT_URL`   | Cadena del **session pooler** (puerto 5432)     |
   | `AUTH_SECRET`  | Un secreto aleatorio: `openssl rand -base64 32` |
   | `TZ`           | `America/Caracas` (zona horaria del negocio)    |

   `AUTH_URL` no es necesaria: Auth.js usa la URL del despliegue (`trustHost`). Pega los valores
   sin comillas y sin espacios al final; una variable vacía hace fallar el build.

3. Pulsa **Deploy** (o **Redeploy** si el proyecto ya existía: los cambios de variables no se
   aplican a un despliegue en curso). El build ejecuta `prisma generate` (postinstall),
   `prisma migrate deploy` (usa `DIRECT_URL`) y `next build`. Al terminar, abre la URL, entra con
   `admin@stockpilot.dev` y revisa el dashboard, un PDF de reportes y `/api-docs`.

## 4. Qué tener en cuenta en serverless

- **Conexiones**: cada instancia de función abre su propio pool (`max: 3` en producción, ver
  `src/lib/db.ts`). Por eso `DATABASE_URL` apunta al pooler de transacciones de Supabase, que
  multiplexa cientos de conexiones cortas sobre pocas conexiones reales.
- **Rate limiting en memoria**: cada instancia de función lleva su propio contador; en Vercel el
  límite es por instancia, no global. Suficiente para una demo; para producción real, respaldarlo
  en un almacén compartido (Redis) usando la misma interfaz de `src/lib/rate-limit.ts`.
- **Zona horaria**: los cortes de día (dashboard, kardex, movimientos por fecha) usan la zona del
  proceso (`TZ`), también dentro de las consultas SQL del dashboard, así que un movimiento de las
  21:00 en Caracas cuenta en el día local.
- **Arranque en frío**: la primera petición tras inactividad tarda unos segundos. Los proyectos
  gratuitos de Supabase se **pausan tras 7 días sin actividad**; se reanudan desde el panel en un
  minuto.
- **PDF**: pdfmake se ejecuta sin empaquetar (`serverExternalPackages`) y las métricas de las
  fuentes estándar se incluyen en la función con `outputFileTracingIncludes`.
- **CSP**: la política estricta ya incluye los orígenes de Scalar (`/api-docs`). No hace falta
  añadir nada para Vercel.

## 5. Solución de problemas

| Síntoma                                                     | Causa probable y solución                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Can't reach database server at localhost:5432` en el build | `DATABASE_URL`/`DIRECT_URL` no existen para el entorno Production en Vercel (se usó el marcador). |
| `Connection url is empty`                                   | La variable existe pero está vacía. Vuelve a pegar el valor y haz Redeploy.                       |
| `password authentication failed for user "postgres.REF"`    | Contraseña incorrecta o con caracteres sin codificar en la URL.                                   |
| `ENETUNREACH` al conectar                                   | Se usó la _Direct connection_ (solo IPv6). Usa el session pooler.                                 |
| `prepared statement "sX" already exists`                    | Migraciones lanzadas contra el puerto 6543. `DIRECT_URL` debe ser el session pooler (5432).       |
| Primera carga muy lenta o error 500 tras días sin uso       | Proyecto de Supabase pausado: reanúdalo desde el panel.                                           |
| El PDF devuelve 500 en Vercel pero funciona en local        | Verifica que `outputFileTracingIncludes` siga apuntando a `node_modules/pdfkit/js/data/**`.       |
| Fechas del dashboard desplazadas un día                     | Falta la variable `TZ` en Vercel.                                                                 |
