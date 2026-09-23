import type { Prisma } from "@/generated/prisma/client";

/**
 * Doble de prueba mínimo del cliente de transacción de Prisma con el subconjunto de
 * operaciones que usa applyStockMovement. Mantiene el estado en memoria para poder
 * comprobar existencias, costo promedio y movimientos registrados.
 */

export interface FakeProduct {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
  avgCost: number;
}

export interface FakeWarehouse {
  id: string;
  name: string;
  isActive: boolean;
}

export interface FakeState {
  products: FakeProduct[];
  warehouses: FakeWarehouse[];
  stocks: { productId: string; warehouseId: string; quantity: number }[];
  movements: Record<string, unknown>[];
}

export function createFakeDb(initial: Partial<FakeState> = {}) {
  // Copia profunda: cada test parte de un estado propio aunque comparta la fixture.
  const state: FakeState = structuredClone({
    products: initial.products ?? [],
    warehouses: initial.warehouses ?? [],
    stocks: initial.stocks ?? [],
    movements: initial.movements ?? [],
  });

  const stockOf = (productId: string, warehouseId: string) =>
    state.stocks.find((s) => s.productId === productId && s.warehouseId === warehouseId);

  const tx = {
    product: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const product = state.products.find((p) => p.id === where.id);
        if (!product) return null;
        return {
          ...product,
          avgCost: { toString: () => String(product.avgCost), toFixed: () => "" },
          stocks: state.stocks
            .filter((s) => s.productId === product.id)
            .map(({ warehouseId, quantity }) => ({ warehouseId, quantity })),
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: { avgCost: number } }) => {
        const product = state.products.find((p) => p.id === where.id)!;
        product.avgCost = data.avgCost;
        return product;
      },
    },
    warehouse: {
      findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
        state.warehouses.filter((w) => where.id.in.includes(w.id)),
    },
    stock: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { productId: string; warehouseId: string; quantity: { gte: number } };
        data: { quantity: { decrement: number } };
      }) => {
        const stock = stockOf(where.productId, where.warehouseId);
        if (!stock || stock.quantity < where.quantity.gte) return { count: 0 };
        stock.quantity -= data.quantity.decrement;
        return { count: 1 };
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { productId_warehouseId: { productId: string; warehouseId: string } };
        create: { productId: string; warehouseId: string; quantity: number };
        update: { quantity: { increment: number } };
      }) => {
        const key = where.productId_warehouseId;
        const stock = stockOf(key.productId, key.warehouseId);
        if (stock) stock.quantity += update.quantity.increment;
        else state.stocks.push({ ...create });
        return stock ?? create;
      },
    },
    stockMovement: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const movement = { id: `mov-${state.movements.length + 1}`, ...data };
        state.movements.push(movement);
        return movement;
      },
    },
  };

  return { state, tx: tx as unknown as Prisma.TransactionClient };
}
