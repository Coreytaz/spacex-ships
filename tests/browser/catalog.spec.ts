import { expect, test } from "@playwright/test";
import { ship, ships } from "../fixtures";

test("loads images and closes the filter panel on backdrop click and resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 700 });
  await page.route("https://api.spacexdata.com/latest/**", (route) =>
    route.fulfill({
      json: {
        ...ships,
        docs: [{ ...ship, image: "https://images.example.test/ship.svg" }],
      },
    }),
  );
  await page.route("https://images.example.test/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#31536c"/></svg>',
    }),
  );
  await page.goto("/");
  const image = page.getByRole("img", { name: "GO Quest" });
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBe(640);
  const opener = page.getByRole("button", { name: /Фильтры/ });
  await opener.click();
  await page.locator(".modal-backdrop").click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.setViewportSize({ width: 960, height: 700 });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Фильтры", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

for (const width of [375, 768, 960, 1440]) {
  test("catalogue and details at " + width + "px", async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let requests = 0;
    await page.route("https://api.spacexdata.com/latest/**", async (route) => {
      requests++;
      if (route.request().method() === "POST") {
        await route.fulfill({
          json: {
            ...ships,
            docs: [
              ship,
              {
                ...ship,
                id: "ship-2",
                name: "A very long vessel name that should wrap without causing horizontal overflow",
                type: "High Speed Craft",
                active: false,
                home_port: "Port of Los Angeles",
                image: "https://images.example.test/missing.jpg",
              },
            ],
          },
        });
      } else
        await route.fulfill({
          json: { ...ship, mass_kg: 0, year_built: null, roles: [] },
        });
    });
    await page.route("https://images.example.test/**", (route) =>
      route.fulfill({ status: 404 }),
    );
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "GO Quest", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Фото недоступно").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 960) {
      const opener = page.getByRole("button", { name: /Фильтры/ });
      await opener.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Закрыть фильтры" }),
      ).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        dialog.getByRole("button", { name: /Показать результаты/ }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        dialog.getByRole("button", { name: "Закрыть фильтры" }),
      ).toBeFocused();
      await page.screenshot({
        path: "test-results/filters-" + width + ".png",
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
      await opener.click();
      await page.getByRole("searchbox").fill("GO");
      await page.getByRole("button", { name: /Показать результаты/ }).click();
      await expect(page).toHaveURL(/search=GO/);
      await expect(dialog).not.toBeVisible();
      await opener.click();
      await page.getByRole("button", { name: /Сбросить фильтры/ }).click();
      await page.getByRole("button", { name: "Закрыть фильтры" }).click();
    } else {
      await expect(
        page.getByRole("heading", { name: "Фильтры", exact: true }),
      ).toBeVisible();
      expect(await page.getByRole("dialog").count()).toBe(0);
    }
    await page.screenshot({
      path: "test-results/catalogue-" + width + ".png",
      fullPage: true,
    });
    const before = requests;
    await page.getByRole("button", { name: "Следующая страница" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect.poll(() => requests).toBe(before + 1);
    await page.goBack();
    await expect(
      page.getByRole("heading", { name: "GO Quest", exact: true }),
    ).toBeVisible();
    expect(requests).toBe(before + 1);
    await page
      .getByRole("link")
      .filter({
        has: page.getByRole("heading", { name: "GO Quest", exact: true }),
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "GO Quest.", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("0 кг", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/detail-" + width + ".png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "К каталогу кораблей" }).click();
    await expect(
      page.getByRole("heading", { name: "GO Quest", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("error, empty response and missing ship states", async ({ page }) => {
  let count = 0;
  await page.route("https://api.spacexdata.com/latest/**", async (route) => {
    if (route.request().method() !== "POST")
      return route.fulfill({ status: 404, json: { error: "Not found" } });
    count++;
    if (count === 1)
      return route.fulfill({
        status: 525,
        contentType: "text/html",
        body: "<html>SSL handshake failed</html>",
      });
    return route.fulfill({
      json: {
        ...ships,
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        nextPage: null,
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("HTTP 525");
  await page.screenshot({ path: "test-results/api-error.png", fullPage: true });
  await expect(
    page.getByRole("button", { name: "Следующая страница" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Повторить загрузку/ }).click();
  await expect(
    page.getByRole("heading", { name: "Корабли не найдены" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Следующая страница" }),
  ).toBeDisabled();
  await page.goto("/product/missing");
  await expect(page.getByRole("alert")).toContainText("Корабль не найден");
});
