import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/rate-limit";

function createClock(start = 0) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe("createRateLimiter", () => {
  it("permite hasta el límite y bloquea el siguiente intento", () => {
    const clock = createClock();
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: clock.now });

    expect(limiter.consume("a").allowed).toBe(true);
    expect(limiter.consume("a").allowed).toBe(true);
    expect(limiter.consume("a").remaining).toBe(0);

    const blocked = limiter.consume("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(1000);
  });

  it("libera intentos cuando expira la ventana deslizante", () => {
    const clock = createClock();
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: clock.now });

    limiter.consume("a");
    clock.advance(500);
    limiter.consume("a");
    expect(limiter.check("a").allowed).toBe(false);

    clock.advance(501);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").remaining).toBe(1);
  });

  it("aísla las claves entre sí", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    limiter.consume("a");
    expect(limiter.check("a").allowed).toBe(false);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("check no consume intentos y reset limpia la clave", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    limiter.check("a");
    limiter.check("a");
    expect(limiter.consume("a").allowed).toBe(true);
    expect(limiter.consume("a").allowed).toBe(false);
    limiter.reset("a");
    expect(limiter.consume("a").allowed).toBe(true);
  });
});
