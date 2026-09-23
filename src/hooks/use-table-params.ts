"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Estado de tablas (página, tamaño, orden, búsqueda, filtros) persistido en la URL.
 * Cada cambio navega con `router.replace`, lo que vuelve a ejecutar el Server
 * Component de la página con los nuevos parámetros.
 */
export function useTableParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (
      changes: Record<string, string | number | null | undefined>,
      options?: { resetPage?: boolean },
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      if (options?.resetPage !== false && !("page" in changes)) next.delete("page");
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return {
    params: searchParams,
    isPending,
    setPage: (page: number) => update({ page: page > 1 ? page : null }, { resetPage: false }),
    setPageSize: (pageSize: number) => update({ pageSize: pageSize !== 10 ? pageSize : null }),
    setSearch: (q: string) => update({ q }),
    setSort: (sort: string | null, order: "asc" | "desc" | null) =>
      update({ sort, order: order === "asc" ? null : order }, { resetPage: false }),
    setFilter: (key: string, value: string | null) =>
      update({ [key]: value === "all" ? null : value }),
  };
}
