/**
 * Generador pseudoaleatorio determinista (mulberry32).
 * Con la misma semilla el seed produce exactamente los mismos datos, lo que
 * facilita reproducir escenarios y capturas de pantalla.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    /** Número en [0, 1). */
    next,
    /** Entero en [min, max] inclusive. */
    int(min: number, max: number): number {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    /** Decimal en [min, max) redondeado. */
    float(min: number, max: number, decimals = 2): number {
      const factor = 10 ** decimals;
      return Math.round((min + next() * (max - min)) * factor) / factor;
    },
    /** Elemento aleatorio de una lista no vacía. */
    pick<T>(items: readonly T[]): T {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new Error("No se puede elegir de una lista vacía");
      return item;
    },
    /** true con probabilidad p. */
    chance(probability: number): boolean {
      return next() < probability;
    },
    /** Copia barajada (Fisher-Yates). */
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
