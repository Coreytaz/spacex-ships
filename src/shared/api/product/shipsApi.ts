import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { DocShip, Ships, ShipFilters } from "../../types/types";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://api.spacexdata.com/latest"
).replace(/\/+$/, "");
export const PAGE_SIZE = 5;
export const API_TIMEOUT = 15_000;
const nullableString = (v: unknown) => v === null || typeof v === "string";
const nullableNumber = (v: unknown) =>
  v === null || (typeof v === "number" && Number.isFinite(v));
export function isShip(value: unknown): value is DocShip {
  if (!value || typeof value !== "object") return false;
  const ship = value as Record<string, unknown>;
  return (
    typeof ship.id === "string" &&
    typeof ship.name === "string" &&
    ["type", "home_port", "image", "model"].every((key) =>
      nullableString(ship[key]),
    ) &&
    ["mass_kg", "year_built"].every((key) => nullableNumber(ship[key])) &&
    typeof ship.active === "boolean" &&
    Array.isArray(ship.roles) &&
    ship.roles.every((role) => typeof role === "string")
  );
}
export function isShips(value: unknown): value is Ships {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    Array.isArray(data.docs) &&
    data.docs.every(isShip) &&
    ["totalDocs", "limit", "totalPages"].every(
      (key) => Number.isSafeInteger(data[key]) && (data[key] as number) >= 0,
    ) &&
    Number.isSafeInteger(data.page) &&
    (data.page as number) >= 1 &&
    typeof data.hasPrevPage === "boolean" &&
    typeof data.hasNextPage === "boolean" &&
    ["prevPage", "nextPage"].every(
      (key) =>
        data[key] === null ||
        (Number.isSafeInteger(data[key]) && (data[key] as number) >= 1),
    )
  );
}
const rawQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
});
const validatedQuery: BaseQueryFn<
  FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extra) => {
  const result = await rawQuery(args, api, extra);
  if (result.error) return { error: result.error };
  const valid =
    args.url === "/ships/query" ? isShips(result.data) : isShip(result.data);
  return valid
    ? { data: result.data }
    : { error: { status: "CUSTOM_ERROR", error: "INVALID_RESPONSE" } };
};
export const shipsApi = createApi({
  reducerPath: "shipsApi",
  baseQuery: validatedQuery,
  endpoints: (builder) => ({
    getShips: builder.query<Ships, ShipFilters>({
      query: ({ search, type, port, page }) => ({
        url: "/ships/query",
        method: "POST",
        body: {
          query: {
            ...(search ? { $text: { $search: search } } : {}),
            ...(type ? { type: { $in: [type] } } : {}),
            ...(port.length ? { home_port: { $in: port } } : {}),
          },
          options: { limit: PAGE_SIZE, page },
        },
      }),
    }),
    getShip: builder.query<DocShip, string>({
      query: (id) => ({ url: "/ships/" + encodeURIComponent(id) }),
    }),
  }),
});
export function describeApiError(error: unknown): string {
  const status =
    error && typeof error === "object" && "status" in error
      ? error.status
      : undefined;
  if (status === "TIMEOUT_ERROR")
    return "Сервер не ответил за 15 секунд. Попробуйте ещё раз.";
  if (status === 404)
    return "Корабль не найден. Возможно, он больше не доступен в каталоге.";
  if (status === "CUSTOM_ERROR" || status === "PARSING_ERROR") {
    const originalStatus =
      error && typeof error === "object" && "originalStatus" in error
        ? error.originalStatus
        : undefined;
    if (typeof originalStatus === "number" && originalStatus >= 400)
      return (
        "Сервис SpaceX недоступен (HTTP " +
        originalStatus +
        "). Попробуйте позже."
      );
    return "Сервер вернул некорректные данные. Попробуйте повторить запрос.";
  }
  if (typeof status === "number")
    return "Сервис SpaceX недоступен (HTTP " + status + "). Попробуйте позже.";
  return "Не удалось связаться с API SpaceX. Проверьте подключение или попробуйте позже.";
}
