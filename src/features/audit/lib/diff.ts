import { formatDateTime } from "@/lib/format";

export type Snapshot = Record<string, unknown>;

/** Campos técnicos que cambian en toda edición y no aportan al lector. */
const NOISE_KEYS = new Set(["updatedAt"]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** Convierte el JSON guardado en la bitácora en un objeto; valores no objeto se envuelven. */
export function parseSnapshot(json: string | null | undefined): Snapshot | null {
  if (!json) return null;
  try {
    const value: unknown = JSON.parse(json);
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return value as Snapshot;
    }
    return { value };
  } catch {
    return { value: json };
  }
}

export interface DiffEntry {
  key: string;
  before: unknown;
  after: unknown;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Campos que cambian entre dos snapshots (unión de claves, en orden de aparición).
 * Con `before` nulo devuelve todo `after` (creación) y viceversa (eliminación).
 */
export function diffSnapshots(before: Snapshot | null, after: Snapshot | null): DiffEntry[] {
  const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const entries: DiffEntry[] = [];
  for (const key of keys) {
    if (NOISE_KEYS.has(key)) continue;
    const previous = before?.[key];
    const next = after?.[key];
    if (before && after && same(previous, next)) continue;
    entries.push({ key, before: previous, after: next });
  }
  return entries;
}

/** Representación legible de un valor de snapshot (fechas ISO, booleanos, objetos). */
export function formatSnapshotValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    return ISO_DATE_PATTERN.test(value) ? formatDateTime(value) : value;
  }
  return JSON.stringify(value);
}
