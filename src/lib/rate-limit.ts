/**
 * Limitador de intentos en memoria con ventana deslizante.
 *
 * Suficiente para una instancia (el caso de este proyecto). Con varias instancias
 * habría que respaldarlo en Redis o en una tabla; la interfaz se mantendría igual.
 */
export interface RateLimiterOptions {
  /** Intentos permitidos dentro de la ventana. */
  limit: number;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
  /** Reloj inyectable (facilita los tests). */
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Milisegundos hasta que se libere el siguiente intento (0 si está permitido). */
  retryAfterMs: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { limit, windowMs } = options;
  const now = options.now ?? (() => Date.now());
  const attempts = new Map<string, number[]>();

  function prune(key: string, timestamp: number): number[] {
    const recent = (attempts.get(key) ?? []).filter((t) => timestamp - t < windowMs);
    if (recent.length === 0) attempts.delete(key);
    else attempts.set(key, recent);
    return recent;
  }

  return {
    /** Comprueba si la clave puede intentar de nuevo, sin consumir intento. */
    check(key: string): RateLimitResult {
      const timestamp = now();
      const recent = prune(key, timestamp);
      if (recent.length < limit) {
        return { allowed: true, remaining: limit - recent.length, retryAfterMs: 0 };
      }
      const oldest = recent[0] ?? timestamp;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, oldest + windowMs - timestamp),
      };
    },

    /** Consume un intento (si está permitido) y devuelve el estado resultante. */
    consume(key: string): RateLimitResult {
      const result = this.check(key);
      if (!result.allowed) return result;
      const timestamp = now();
      const recent = attempts.get(key) ?? [];
      recent.push(timestamp);
      attempts.set(key, recent);
      return { allowed: true, remaining: limit - recent.length, retryAfterMs: 0 };
    },

    /** Limpia los intentos de una clave (p. ej. tras un login correcto). */
    reset(key: string): void {
      attempts.delete(key);
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
