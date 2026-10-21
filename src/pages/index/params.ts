import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ShipFilters } from "../../shared/types/types";
export function readFilters(params: URLSearchParams): ShipFilters {
  const page = Number(params.get("page") || 1);
  return {
    search: params.get("search") || "",
    port: [...new Set((params.get("port") || "").split("_").filter(Boolean))],
    type: params.get("type") || "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export function useShipFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const update = useCallback(
    (changes: Partial<ShipFilters>) => {
      setParams((previous) => {
        const next = new URLSearchParams(previous);
        if ("search" in changes)
          changes.search
            ? next.set("search", changes.search)
            : next.delete("search");
        if ("type" in changes)
          changes.type ? next.set("type", changes.type) : next.delete("type");
        if ("port" in changes)
          changes.port?.length
            ? next.set("port", changes.port.join("_"))
            : next.delete("port");
        const page = "page" in changes ? changes.page : 1;
        page && page > 1 ? next.set("page", String(page)) : next.delete("page");
        return next;
      });
    },
    [setParams],
  );
  const reset = useCallback(() => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      ["search", "port", "type", "page"].forEach((key) => next.delete(key));
      return next;
    });
  }, [setParams]);
  return { filters, update, reset };
}
