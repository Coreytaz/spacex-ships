import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import App from "../src/app";
import { createAppStore } from "../src/app/store";
import { shipsApi } from "../src/shared/api/product/shipsApi";
import { readFilters } from "../src/pages/index/params";
import { ships } from "./fixtures";
let store = createAppStore();
afterEach(() => {
  store.dispatch(shipsApi.util.resetApiState());
  store = createAppStore();
});
function mount(url = "/") {
  const router = createMemoryRouter([{ path: "*", element: <App /> }], {
    initialEntries: [url],
  });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return router;
}
function mockApi() {
  const fetchMock = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(ships))),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
it("sanitizes invalid page numbers and preserves the existing port URL format", () => {
  for (const page of ["-1", "0", "NaN", "Infinity", "1.5"])
    expect(readFilters(new URLSearchParams({ page })).page).toBe(1);
  expect(
    readFilters(new URLSearchParams("port=Port+Canaveral_Fort+Lauderdale"))
      .port,
  ).toEqual(["Port Canaveral", "Fort Lauderdale"]);
});
it("loads once, atomically resets page on filter changes, and restores back/forward state", async () => {
  const fetchMock = mockApi();
  const router = mount("/?page=2");
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "GO Quest" });
  await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("radio", { name: "Tug" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(router.state.location.search).toBe("?type=Tug");
  expect(await (fetchMock.mock.calls[1][0] as Request).json()).toMatchObject({
    options: { page: 1 },
    query: { type: { $in: ["Tug"] } },
  });
  await act(() => router.navigate(-1));
  expect(screen.getByRole("radio", { name: "Любой тип" })).toBeChecked();
  expect(router.state.location.search).toBe("?page=2");
  await act(() => router.navigate(1));
  expect(screen.getByRole("radio", { name: "Tug" })).toBeChecked();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it("debounces search and resets all filters", async () => {
  const fetchMock = mockApi();
  const router = mount("/?type=Tug&page=2");
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "GO Quest" });
  await user.type(screen.getByRole("searchbox"), "GO");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(new URLSearchParams(router.state.location.search).get("search")).toBe(
    "GO",
  );
  expect(new URLSearchParams(router.state.location.search).has("page")).toBe(
    false,
  );
  await user.click(screen.getByRole("button", { name: /Сбросить фильтры/ }));
  expect(router.state.location.search).toBe("");
  expect(screen.getByRole("searchbox")).toHaveValue("");
  expect(screen.getByRole("radio", { name: "Любой тип" })).toBeChecked();
});
it("renders an error, blocks pagination, and retries from the UI", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 525 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ships))),
  );
  mount();
  await screen.findByText(/HTTP 525/);
  expect(
    screen.getByRole("button", { name: "Следующая страница" }),
  ).toBeDisabled();
  await userEvent.click(
    screen.getByRole("button", { name: /Повторить загрузку/ }),
  );
  await screen.findByRole("heading", { name: "GO Quest" });
});
