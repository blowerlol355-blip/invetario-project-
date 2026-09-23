import "dotenv/config";

import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";

import { calculateWeightedAverageCost, roundCost } from "@/features/stock/lib/average-cost";
import { prisma } from "@/lib/db";
import type { AuditAction, MovementType, PurchaseOrderStatus, UserRole } from "@/lib/domain";

import {
  ADJUSTMENT_DOWN_REASONS,
  ADJUSTMENT_UP_REASONS,
  CATEGORIES,
  costTier,
  DEMO_USERS,
  IN_REASONS,
  inferUnit,
  OUT_REASONS,
  PO_NOTES,
  PRODUCT_TEMPLATES,
  SUPPLIERS,
  TRANSFER_REASONS,
  WAREHOUSES,
} from "./seed/data";
import { createRandom } from "./seed/random";

/**
 * Seed de StockPilot.
 *
 * Genera un escenario realista y determinista (semilla fija):
 * 3 usuarios, 8 categorías, 10 proveedores, 3 almacenes, 150 productos,
 * ~500 movimientos en los últimos 90 días, órdenes de compra en todos los
 * estados y entradas de auditoría.
 *
 * Las existencias (Stock) y el costo promedio (Product.avgCost) NO se inventan:
 * se derivan reproduciendo los movimientos en orden cronológico con las mismas
 * reglas de negocio que usará la aplicación (sin stock negativo, promedio
 * ponderado en cada entrada).
 */

const SEED = 20260922;
const DAYS_OF_HISTORY = 90;
const rng = createRandom(SEED);
const now = new Date();

// ----------------------------- Utilidades ---------------------------

function daysAgo(days: number, hour = rng.int(8, 18), minute = rng.int(0, 59)): Date {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, rng.int(0, 59), 0);
  return date;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

async function insertInChunks<T>(
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
  size = 100,
): Promise<void> {
  for (let i = 0; i < rows.length; i += size) {
    await insert(rows.slice(i, i + size));
  }
}

/** Precio de venta "comercial" a partir del costo y un margen. */
function toSalePrice(cost: number): number {
  const raw = cost * rng.float(1.3, 1.65, 2);
  if (raw < 10) return Math.round(raw * 10) / 10;
  return Math.floor(raw) + 0.9;
}

// ----------------------------- Tipos internos -----------------------

interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductRow {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: string;
  categoryCode: string;
  supplierId: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  avgCost: number;
  minStock: number;
  maxStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MovementRow {
  id: string;
  type: MovementType;
  productId: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  quantity: number;
  unitCost: number | null;
  reason: string;
  reference: string | null;
  userId: string;
  createdAt: Date;
}

interface PurchaseOrderRow {
  id: string;
  code: string;
  supplierId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  expectedDate: Date | null;
  notes: string | null;
  createdById: string;
  sentAt: Date | null;
  receivedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PurchaseOrderItemRow {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
}

interface AuditRow {
  id: string;
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  before: string | null;
  after: string | null;
  createdAt: Date;
}

// ----------------------------- Estado del inventario ----------------

/** Existencias en memoria: `${productId}:${warehouseId}` -> cantidad. */
const stock = new Map<string, number>();
/** Costo promedio ponderado por producto. */
const averageCost = new Map<string, number>();
const movements: MovementRow[] = [];

const stockKey = (productId: string, warehouseId: string) => `${productId}:${warehouseId}`;
const getStock = (productId: string, warehouseId: string) =>
  stock.get(stockKey(productId, warehouseId)) ?? 0;
const addStock = (productId: string, warehouseId: string, delta: number) =>
  stock.set(stockKey(productId, warehouseId), getStock(productId, warehouseId) + delta);

function totalStock(productId: string): number {
  let total = 0;
  for (const [key, quantity] of stock) {
    if (key.startsWith(`${productId}:`)) total += quantity;
  }
  return total;
}

interface MovementInput {
  productId: string;
  quantity: number;
  userId: string;
  reason: string;
  reference?: string | null;
  createdAt: Date;
}

function recordIn(input: MovementInput & { warehouseId: string; unitCost: number }): void {
  const previousQuantity = totalStock(input.productId);
  const previousAverage = averageCost.get(input.productId) ?? 0;
  averageCost.set(
    input.productId,
    calculateWeightedAverageCost(previousQuantity, previousAverage, input.quantity, input.unitCost),
  );
  addStock(input.productId, input.warehouseId, input.quantity);
  movements.push({
    id: randomUUID(),
    type: "IN",
    productId: input.productId,
    fromWarehouseId: null,
    toWarehouseId: input.warehouseId,
    quantity: input.quantity,
    unitCost: roundCost(input.unitCost),
    reason: input.reason,
    reference: input.reference ?? null,
    userId: input.userId,
    createdAt: input.createdAt,
  });
}

/** Devuelve false si no hay existencia suficiente (regla: sin stock negativo). */
function recordOut(input: MovementInput & { warehouseId: string }): boolean {
  if (getStock(input.productId, input.warehouseId) < input.quantity) return false;
  addStock(input.productId, input.warehouseId, -input.quantity);
  movements.push({
    id: randomUUID(),
    type: "OUT",
    productId: input.productId,
    fromWarehouseId: input.warehouseId,
    toWarehouseId: null,
    quantity: input.quantity,
    unitCost: null,
    reason: input.reason,
    reference: input.reference ?? null,
    userId: input.userId,
    createdAt: input.createdAt,
  });
  return true;
}

function recordTransfer(
  input: MovementInput & { fromWarehouseId: string; toWarehouseId: string },
): boolean {
  if (getStock(input.productId, input.fromWarehouseId) < input.quantity) return false;
  addStock(input.productId, input.fromWarehouseId, -input.quantity);
  addStock(input.productId, input.toWarehouseId, input.quantity);
  movements.push({
    id: randomUUID(),
    type: "TRANSFER",
    productId: input.productId,
    fromWarehouseId: input.fromWarehouseId,
    toWarehouseId: input.toWarehouseId,
    quantity: input.quantity,
    unitCost: null,
    reason: input.reason,
    reference: input.reference ?? null,
    userId: input.userId,
    createdAt: input.createdAt,
  });
  return true;
}

function recordAdjustment(
  input: MovementInput & { warehouseId: string; direction: "up" | "down" },
): boolean {
  const decreases = input.direction === "down";
  if (decreases && getStock(input.productId, input.warehouseId) < input.quantity) return false;
  addStock(input.productId, input.warehouseId, decreases ? -input.quantity : input.quantity);
  movements.push({
    id: randomUUID(),
    type: "ADJUSTMENT",
    productId: input.productId,
    fromWarehouseId: decreases ? input.warehouseId : null,
    toWarehouseId: decreases ? null : input.warehouseId,
    quantity: input.quantity,
    unitCost: null,
    reason: input.reason,
    reference: input.reference ?? null,
    userId: input.userId,
    createdAt: input.createdAt,
  });
  return true;
}

// ----------------------------- Seed ---------------------------------

async function clearDatabase(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();
}

async function main(): Promise<void> {
  console.log("Limpiando base de datos...");
  await clearDatabase();

  const catalogDate = daysAgo(DAYS_OF_HISTORY + 10, 9, 0);

  // Usuarios
  const users: UserRow[] = DEMO_USERS.map((user) => ({
    id: randomUUID(),
    name: user.name,
    email: user.email,
    passwordHash: bcrypt.hashSync(user.password, 10),
    role: user.role,
    isActive: true,
    createdAt: catalogDate,
    updatedAt: catalogDate,
  }));
  await prisma.user.createMany({ data: users });
  const admin = users.find((u) => u.role === "ADMIN")!;
  const manager = users.find((u) => u.role === "MANAGER")!;
  const operator = users.find((u) => u.role === "OPERATOR")!;
  const pickOperationalUser = () => (rng.chance(0.7) ? operator : manager);
  console.log(`Usuarios: ${users.length}`);

  // Categorías
  const categories = CATEGORIES.map((category) => ({
    id: randomUUID(),
    code: category.code,
    name: category.name,
    description: category.description,
    costRange: category.costRange,
    isActive: true,
    createdAt: catalogDate,
    updatedAt: catalogDate,
  }));
  await prisma.category.createMany({
    data: categories.map(({ code: _code, costRange: _range, ...row }) => row),
  });
  const categoryByCode = new Map(categories.map((c) => [c.code, c]));
  console.log(`Categorías: ${categories.length}`);

  // Almacenes
  const warehouses = WAREHOUSES.map((warehouse) => ({
    id: randomUUID(),
    name: warehouse.name,
    code: warehouse.code,
    address: warehouse.address,
    isActive: true,
    createdAt: catalogDate,
    updatedAt: catalogDate,
  }));
  await prisma.warehouse.createMany({ data: warehouses });
  const central = warehouses.find((w) => w.code === "CEN")!;
  const branches = warehouses.filter((w) => w.code !== "CEN");
  console.log(`Almacenes: ${warehouses.length}`);

  // Proveedores
  const suppliers = SUPPLIERS.map((supplier) => ({
    id: randomUUID(),
    name: supplier.name,
    contactName: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    taxId: supplier.taxId,
    categories: supplier.categories,
    isActive: true,
    createdAt: catalogDate,
    updatedAt: catalogDate,
  }));
  await prisma.supplier.createMany({
    data: suppliers.map(({ categories: _categories, ...row }) => row),
  });
  const suppliersForCategory = (code: string) =>
    suppliers.filter((s) => s.categories.includes(code));
  console.log(`Proveedores: ${suppliers.length}`);

  // Productos
  const skuCounters = new Map<string, number>();
  const productDate = daysAgo(DAYS_OF_HISTORY + 5, 10, 0);
  const products: ProductRow[] = PRODUCT_TEMPLATES.slice(0, 150).map((template) => {
    const category = categoryByCode.get(template.category)!;
    const sequence = (skuCounters.get(category.code) ?? 0) + 1;
    skuCounters.set(category.code, sequence);
    const [minCost, maxCost] = category.costRange;
    const [tierFrom, tierTo] = costTier(template.name);
    const span = maxCost - minCost;
    const costPrice = Math.max(
      0.25,
      rng.float(minCost + span * tierFrom, minCost + span * tierTo, 2),
    );
    const minStock = rng.int(5, 30);

    return {
      id: randomUUID(),
      sku: `${category.code}-${String(sequence).padStart(4, "0")}`,
      barcode: `779${String(rng.int(100_000_000, 999_999_999))}${rng.int(0, 9)}`,
      name: template.name,
      description: `${template.name} de la línea ${category.name.toLowerCase()}.`,
      categoryId: category.id,
      categoryCode: category.code,
      supplierId: rng.pick(suppliersForCategory(category.code)).id,
      unit: template.unit ?? inferUnit(template.name),
      costPrice,
      salePrice: toSalePrice(costPrice),
      avgCost: 0,
      minStock,
      maxStock: minStock * rng.int(4, 6),
      isActive: true,
      createdAt: productDate,
      updatedAt: productDate,
    };
  });
  await insertInChunks(products, (chunk) =>
    prisma.product.createMany({
      data: chunk.map(({ categoryCode: _code, ...row }) => row),
    }),
  );
  console.log(`Productos: ${products.length}`);

  // -- Inventario inicial (hace 90 días) --
  let invoiceCounter = 1000;
  for (const product of products) {
    recordIn({
      productId: product.id,
      warehouseId: central.id,
      quantity: rng.int(product.minStock * 2, product.minStock * 5),
      unitCost: rng.float(product.costPrice * 0.95, product.costPrice * 1.05, 2),
      userId: admin.id,
      reason: "Inventario inicial",
      reference: "INV-INICIAL",
      createdAt: daysAgo(DAYS_OF_HISTORY, rng.int(8, 11)),
    });
    for (const branch of branches) {
      if (rng.chance(0.3)) {
        recordIn({
          productId: product.id,
          warehouseId: branch.id,
          quantity: rng.int(product.minStock, product.minStock * 2),
          unitCost: rng.float(product.costPrice * 0.95, product.costPrice * 1.05, 2),
          userId: admin.id,
          reason: "Inventario inicial",
          reference: "INV-INICIAL",
          createdAt: daysAgo(DAYS_OF_HISTORY, rng.int(12, 17)),
        });
      }
    }
  }

  // -- Órdenes de compra --
  const purchaseOrders: PurchaseOrderRow[] = [];
  const purchaseOrderItems: PurchaseOrderItemRow[] = [];
  const audits: AuditRow[] = [];
  let poCounter = 0;

  const plan: { status: PurchaseOrderStatus; createdDaysAgo: number }[] = [
    { status: "RECEIVED", createdDaysAgo: 75 },
    { status: "RECEIVED", createdDaysAgo: 62 },
    { status: "RECEIVED", createdDaysAgo: 48 },
    { status: "RECEIVED", createdDaysAgo: 33 },
    { status: "RECEIVED", createdDaysAgo: 19 },
    { status: "CANCELLED", createdDaysAgo: 40 },
    { status: "PARTIALLY_RECEIVED", createdDaysAgo: 12 },
    { status: "PARTIALLY_RECEIVED", createdDaysAgo: 8 },
    { status: "SENT", createdDaysAgo: 5 },
    { status: "SENT", createdDaysAgo: 3 },
    { status: "DRAFT", createdDaysAgo: 1 },
    { status: "DRAFT", createdDaysAgo: 0 },
  ];

  const year = now.getFullYear();
  /** Recepciones pendientes de aplicar en orden cronológico. */
  const receipts: { date: Date; order: PurchaseOrderRow; items: PurchaseOrderItemRow[] }[] = [];

  for (const step of plan) {
    poCounter += 1;
    const supplier = rng.pick(suppliers);
    const candidateProducts = products.filter((p) => supplier.categories.includes(p.categoryCode));
    const chosen = rng.shuffle(candidateProducts).slice(0, rng.int(3, 6));
    const createdAt = daysAgo(step.createdDaysAgo, rng.int(8, 15));
    const sentAt =
      step.status === "DRAFT" ? null : daysAgo(step.createdDaysAgo, createdAt.getHours() + 1);
    const receiptDaysAgo = Math.max(0, step.createdDaysAgo - rng.int(3, 7));
    const receivedAt =
      step.status === "RECEIVED" || step.status === "PARTIALLY_RECEIVED"
        ? daysAgo(receiptDaysAgo)
        : null;
    const cancelledAt = step.status === "CANCELLED" ? daysAgo(step.createdDaysAgo - 2) : null;
    const expectedDate = new Date(createdAt);
    expectedDate.setDate(expectedDate.getDate() + rng.int(5, 12));
    expectedDate.setHours(0, 0, 0, 0);

    const order: PurchaseOrderRow = {
      id: randomUUID(),
      code: `OC-${year}-${String(poCounter).padStart(4, "0")}`,
      supplierId: supplier.id,
      warehouseId: rng.chance(0.75) ? central.id : rng.pick(branches).id,
      status: step.status,
      expectedDate,
      notes: rng.pick(PO_NOTES) || null,
      createdById: manager.id,
      sentAt,
      receivedAt,
      cancelledAt,
      createdAt,
      updatedAt: receivedAt ?? cancelledAt ?? sentAt ?? createdAt,
    };
    purchaseOrders.push(order);

    const items: PurchaseOrderItemRow[] = chosen.map((product) => {
      const quantityOrdered = rng.int(product.minStock, product.minStock * 3);
      let quantityReceived = 0;
      if (step.status === "RECEIVED") quantityReceived = quantityOrdered;
      if (step.status === "PARTIALLY_RECEIVED") {
        quantityReceived = rng.chance(0.6) ? Math.ceil(quantityOrdered / 2) : 0;
      }
      return {
        id: randomUUID(),
        purchaseOrderId: order.id,
        productId: product.id,
        quantityOrdered,
        quantityReceived,
        unitCost: rng.float(product.costPrice * 0.9, product.costPrice * 1.05, 2),
      };
    });
    // Garantiza que una orden parcial tenga al menos un ítem recibido y uno pendiente.
    if (step.status === "PARTIALLY_RECEIVED") {
      const first = items[0]!;
      const last = items[items.length - 1]!;
      first.quantityReceived = Math.max(1, Math.ceil(first.quantityOrdered / 2));
      last.quantityReceived = 0;
    }
    purchaseOrderItems.push(...items);

    audits.push({
      id: randomUUID(),
      userId: manager.id,
      action: "CREATE",
      entity: "PurchaseOrder",
      entityId: order.id,
      before: null,
      after: JSON.stringify({ code: order.code, status: "DRAFT", supplierId: supplier.id }),
      createdAt,
    });
    if (sentAt) {
      audits.push({
        id: randomUUID(),
        userId: manager.id,
        action: "STATUS_CHANGE",
        entity: "PurchaseOrder",
        entityId: order.id,
        before: JSON.stringify({ status: "DRAFT" }),
        after: JSON.stringify({ status: "SENT" }),
        createdAt: sentAt,
      });
    }
    if (cancelledAt) {
      audits.push({
        id: randomUUID(),
        userId: manager.id,
        action: "STATUS_CHANGE",
        entity: "PurchaseOrder",
        entityId: order.id,
        before: JSON.stringify({ status: "SENT" }),
        after: JSON.stringify({ status: "CANCELLED", reason: "Proveedor sin stock" }),
        createdAt: cancelledAt,
      });
    }
    if (receivedAt) {
      receipts.push({ date: receivedAt, order, items });
      audits.push({
        id: randomUUID(),
        userId: operator.id,
        action: "STATUS_CHANGE",
        entity: "PurchaseOrder",
        entityId: order.id,
        before: JSON.stringify({ status: "SENT" }),
        after: JSON.stringify({ status: step.status }),
        createdAt: receivedAt,
      });
    }
  }

  // -- Actividad diaria (eventos aleatorios + recepciones) en orden cronológico --
  type Event = { date: Date; kind: "random" } | { date: Date; kind: "receipt"; index: number };
  const events: Event[] = receipts.map((receipt, index) => ({
    date: receipt.date,
    kind: "receipt" as const,
    index,
  }));
  for (let day = DAYS_OF_HISTORY - 1; day >= 0; day--) {
    const sample = daysAgo(day, 12);
    const count = isWeekend(sample) ? rng.int(0, 2) : rng.int(2, 5);
    for (let i = 0; i < count; i++) events.push({ date: daysAgo(day), kind: "random" });
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const productsWithStock = (warehouseId: string, minimum = 1) =>
    products.filter((p) => getStock(p.id, warehouseId) >= minimum);

  for (const event of events) {
    if (event.kind === "receipt") {
      const receipt = receipts[event.index]!;
      for (const item of receipt.items) {
        if (item.quantityReceived === 0) continue;
        recordIn({
          productId: item.productId,
          warehouseId: receipt.order.warehouseId,
          quantity: item.quantityReceived,
          unitCost: item.unitCost,
          userId: operator.id,
          reason: "Recepción de orden de compra",
          reference: receipt.order.code,
          createdAt: receipt.date,
        });
      }
      continue;
    }

    const roll = rng.next();
    const user = pickOperationalUser();

    if (roll < 0.55) {
      // Venta / salida
      const warehouse = rng.chance(0.5) ? central : rng.pick(branches);
      const candidates = productsWithStock(warehouse.id);
      if (candidates.length === 0) continue;
      const product = rng.pick(candidates);
      const available = getStock(product.id, warehouse.id);
      invoiceCounter += 1;
      recordOut({
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: rng.int(1, Math.min(available, 12)),
        userId: user.id,
        reason: rng.pick(OUT_REASONS),
        reference: `FAC-${invoiceCounter}`,
        createdAt: event.date,
      });
    } else if (roll < 0.75) {
      // Compra directa a proveedor
      const product = rng.pick(products);
      invoiceCounter += 1;
      recordIn({
        productId: product.id,
        warehouseId: rng.chance(0.7) ? central.id : rng.pick(branches).id,
        quantity: rng.int(product.minStock, product.minStock * 3),
        unitCost: rng.float(product.costPrice * 0.9, product.costPrice * 1.1, 2),
        userId: user.id,
        reason: rng.pick(IN_REASONS),
        reference: `FAC-PROV-${invoiceCounter}`,
        createdAt: event.date,
      });
    } else if (roll < 0.9) {
      // Transferencia del central a una sucursal
      const candidates = productsWithStock(central.id, 4);
      if (candidates.length === 0) continue;
      const product = rng.pick(candidates);
      const available = getStock(product.id, central.id);
      recordTransfer({
        productId: product.id,
        fromWarehouseId: central.id,
        toWarehouseId: rng.pick(branches).id,
        quantity: rng.int(2, Math.min(available, 20)),
        userId: user.id,
        reason: rng.pick(TRANSFER_REASONS),
        createdAt: event.date,
      });
    } else {
      // Ajuste de inventario
      const warehouse = rng.pick(warehouses);
      const direction = rng.chance(0.4) ? "up" : "down";
      const candidates = direction === "down" ? productsWithStock(warehouse.id, 2) : products;
      if (candidates.length === 0) continue;
      const product = rng.pick(candidates);
      const available = getStock(product.id, warehouse.id);
      recordAdjustment({
        productId: product.id,
        warehouseId: warehouse.id,
        direction,
        quantity: direction === "down" ? rng.int(1, Math.min(available, 3)) : rng.int(1, 5),
        userId: user.id,
        reason: rng.pick(direction === "up" ? ADJUSTMENT_UP_REASONS : ADJUSTMENT_DOWN_REASONS),
        createdAt: event.date,
      });
    }
  }

  // -- Productos con stock bajo (para el módulo de alertas) --
  const lowStockTargets = rng.shuffle(products).slice(0, 15);
  for (const product of lowStockTargets) {
    let remaining = totalStock(product.id) - Math.max(0, product.minStock - rng.int(0, 3));
    for (const warehouse of warehouses) {
      if (remaining <= 0) break;
      const available = getStock(product.id, warehouse.id);
      if (available === 0) continue;
      const quantity = Math.min(available, remaining);
      invoiceCounter += 1;
      const soldAt = new Date(now.getTime() - rng.int(5, 120) * 60_000);
      recordOut({
        productId: product.id,
        warehouseId: warehouse.id,
        quantity,
        userId: operator.id,
        reason: "Venta",
        reference: `FAC-${invoiceCounter}`,
        createdAt: soldAt,
      });
      remaining -= quantity;
    }
  }

  // -- Persistencia --
  movements.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  await insertInChunks(movements, (chunk) => prisma.stockMovement.createMany({ data: chunk }));
  console.log(`Movimientos: ${movements.length}`);

  const stockRows = [...stock.entries()]
    .filter(([, quantity]) => quantity > 0)
    .map(([key, quantity]) => {
      const [productId, warehouseId] = key.split(":") as [string, string];
      return { productId, warehouseId, quantity, updatedAt: now };
    });
  await insertInChunks(stockRows, (chunk) => prisma.stock.createMany({ data: chunk }));
  console.log(`Registros de stock: ${stockRows.length}`);

  await prisma.$transaction(
    products.map((product) =>
      prisma.product.update({
        where: { id: product.id },
        data: { avgCost: averageCost.get(product.id) ?? 0 },
      }),
    ),
  );

  await insertInChunks(purchaseOrders, (chunk) => prisma.purchaseOrder.createMany({ data: chunk }));
  await insertInChunks(purchaseOrderItems, (chunk) =>
    prisma.purchaseOrderItem.createMany({ data: chunk }),
  );
  console.log(`Órdenes de compra: ${purchaseOrders.length} (${purchaseOrderItems.length} ítems)`);

  for (const user of users) {
    audits.push({
      id: randomUUID(),
      userId: admin.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      before: null,
      after: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
      createdAt: catalogDate,
    });
  }
  await insertInChunks(audits, (chunk) => prisma.auditLog.createMany({ data: chunk }));
  console.log(`Entradas de auditoría: ${audits.length}`);

  const lowStockCount = products.filter((p) => totalStock(p.id) <= p.minStock).length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + totalStock(p.id) * (averageCost.get(p.id) ?? 0),
    0,
  );
  console.log(`Productos con stock bajo: ${lowStockCount}`);
  console.log(`Valor del inventario (costo promedio): USD ${inventoryValue.toFixed(2)}`);
  console.log("Seed completado.");
}

main()
  .catch((error: unknown) => {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
