import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "../src/app/store";
import {
  API_TIMEOUT,
  describeApiError,
  shipsApi,
} from "../src/shared/api/product/shipsApi";
import { ship, ships } from "./fixtures";
const filters = { search: "", type: "", port: [], page: 1 };
let store = createAppStore();
afterEach(() => {
  store.dispatch(shipsApi.util.resetApiState());
  store = createAppStore();
});
function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
describe("SpaceX API", () => {
  it("posts filters and pagination, validates and caches results", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(ships));
    vi.stubGlobal("fetch", fetchMock);
    const args = {
      search: "GO",
      type: "Tug",
      port: ["Port Canaveral"],
      page: 2,
    };
    const result = await store.dispatch(
      shipsApi.endpoints.getShips.initiate(args),
    );
    expect(result.data).toEqual(ships);
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe("POST");
    expect(request.url.endsWith("/ships/query")).toBe(true);
    expect(await request.json()).toEqual({
      query: {
        $text: { $search: "GO" },
        type: { $in: ["Tug"] },
        home_port: { $in: ["Port Canaveral"] },
      },
      options: { limit: 5, page: 2 },
    });
    await store.dispatch(shipsApi.endpoints.getShips.initiate({ ...args }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("loads a ship by id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(ship)));
    expect(
      (await store.dispatch(shipsApi.endpoints.getShip.initiate(ship.id))).data,
    ).toEqual(ship);
  });
  it("accepts an empty catalogue", async () => {
    const empty = {
      ...ships,
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      nextPage: null,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(empty)));
    expect(
      (await store.dispatch(shipsApi.endpoints.getShips.initiate(filters)))
        .data,
    ).toEqual(empty);
  });
  it.each([404, 525])("reports HTTP %s", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ error: "Unavailable" }, status)),
    );
    const result = await store.dispatch(
      shipsApi.endpoints.getShip.initiate(ship.id),
    );
    expect(result.error).toMatchObject({ status });
    expect(describeApiError(result.error)).toContain(
      status === 404 ? "не найден" : "525",
    );
  });
  it("preserves HTTP status when the server returns HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<html>SSL handshake failed</html>", { status: 525 }),
        ),
    );
    const result = await store.dispatch(
      shipsApi.endpoints.getShips.initiate(filters),
    );
    expect(describeApiError(result.error)).toContain("HTTP 525");
  });
  it.each(["invalid json", JSON.stringify({ docs: "broken" })])(
    "rejects malformed responses: %s",
    async (body) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
      const result = await store.dispatch(
        shipsApi.endpoints.getShips.initiate(filters),
      );
      expect(result.isError).toBe(true);
      expect(describeApiError(result.error)).toContain("некорректные данные");
    },
  );
  it("reports a network failure and can retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(response(ships));
    vi.stubGlobal("fetch", fetchMock);
    const failed = await store.dispatch(
      shipsApi.endpoints.getShips.initiate(filters),
    );
    expect(failed.error).toMatchObject({ status: "FETCH_ERROR" });
    const retried = await store.dispatch(
      shipsApi.endpoints.getShips.initiate(filters, { forceRefetch: true }),
    );
    expect(retried.data).toEqual(ships);
  });
  it("times out and aborts the network request at 15 seconds", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((request: Request) => {
        signal = request.signal;
        return new Promise<Response>((_, reject) => {
          signal!.addEventListener("abort", () => reject(signal!.reason), {
            once: true,
          });
        });
      }),
    );
    const pending = store.dispatch(
      shipsApi.endpoints.getShips.initiate(filters),
    );
    await vi.advanceTimersByTimeAsync(API_TIMEOUT + 1);
    const result = await pending;
    expect(signal?.aborted).toBe(true);
    expect(result.error).toMatchObject({ status: "TIMEOUT_ERROR" });
  });
  it("cancels an obsolete request", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((request: Request) => {
        signal = request.signal;
        return new Promise<Response>((_, reject) =>
          request.signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          ),
        );
      }),
    );
    const pending = store.dispatch(
      shipsApi.endpoints.getShips.initiate(filters),
    );
    await vi.waitFor(() => expect(signal).toBeDefined());
    pending.abort();
    expect((await pending).error).toMatchObject({ name: "AbortError" });
    expect(signal?.aborted).toBe(true);
  });
});
