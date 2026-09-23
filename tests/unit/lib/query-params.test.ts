import { describe, expect, it } from "vitest";

import {
  paginate,
  pagination,
  parseListParams,
  resolveSort,
  statusWhere,
} from "@/lib/query-params";

describe("parseListParams", () => {
  it("aplica valores por defecto cuando no hay parámetros", () => {
    expect(parseListParams({})).toEqual({
      page: 1,
      pageSize: 10,
      q: "",
      sort: "",
      order: "asc",
      status: "all",
    });
  });

  it("convierte y valida los parámetros de la URL", () => {
    const params = parseListParams({
      page: "3",
      pageSize: "50",
      q: "  taladro ",
      sort: "name",
      order: "desc",
      status: "inactive",
    });
    expect(params).toEqual({
      page: 3,
      pageSize: 50,
      q: "taladro",
      sort: "name",
      order: "desc",
      status: "inactive",
    });
  });

  it("cae al valor por defecto ante parámetros inválidos en vez de fallar", () => {
    const params = parseListParams({
      page: "-2",
      pageSize: "999",
      order: "sideways",
      status: "borrado",
      q: ["primero", "segundo"],
    });
    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(10);
    expect(params.order).toBe("asc");
    expect(params.status).toBe("all");
    expect(params.q).toBe("primero");
  });

  it("acepta valores por defecto propios de cada página", () => {
    expect(parseListParams({}, { sort: "code", status: "active" })).toMatchObject({
      sort: "code",
      status: "active",
    });
  });
});

describe("helpers de listado", () => {
  it("resolveSort solo admite columnas de la lista blanca", () => {
    expect(resolveSort("name", ["name", "createdAt"], "createdAt")).toBe("name");
    expect(resolveSort("passwordHash", ["name", "createdAt"], "createdAt")).toBe("createdAt");
  });

  it("statusWhere traduce el filtro a la condición de Prisma", () => {
    expect(statusWhere("all")).toEqual({});
    expect(statusWhere("active")).toEqual({ isActive: true });
    expect(statusWhere("inactive")).toEqual({ isActive: false });
  });

  it("pagination calcula skip y take", () => {
    const params = parseListParams({ page: "4", pageSize: "20" });
    expect(pagination(params)).toEqual({ skip: 60, take: 20 });
  });

  it("paginate calcula el número de páginas (mínimo 1)", () => {
    const params = parseListParams({ pageSize: "10" });
    expect(paginate([], 0, params).pageCount).toBe(1);
    expect(paginate([], 25, params).pageCount).toBe(3);
    expect(paginate([], 30, params).pageCount).toBe(3);
  });
});
