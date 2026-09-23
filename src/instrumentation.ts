/**
 * Se ejecuta una vez al arrancar el servidor de Next.js (runtime Node).
 *
 * Vercel no permite definir la variable `TZ` (nombre reservado), así que la zona
 * horaria del negocio llega en `APP_TIMEZONE` y aquí se aplica al proceso antes de
 * que se cree ningún `Date`: date-fns y los formateadores usan la zona del proceso.
 */
export function register(): void {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const timeZone = process.env.APP_TIMEZONE?.trim();
  if (timeZone) process.env.TZ = timeZone;
}
