import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("samara_auth_session", "true")
  })
  await page.goto("/")
})

test("owns vertical scrolling without widening the document", async ({ page }) => {
  const main = page.locator("main[data-app-scroll-root]")

  await expect(main).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => window.innerWidth),
  )
  expect(
    await main.evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true)
})

test("keeps mobile header actions inside the viewport", async ({ page }) => {
  const controls = [
    page.getByRole("button", { name: /Abrir Menu de Navegação/i }),
    page.getByRole("button", { name: /Central de Lembretes/i }),
    page.getByTitle("Perfil Samara / Sair"),
  ]

  for (const control of controls) {
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    )
  }
})

test("scrolls Procedures to the final content inside main", async ({ page }) => {
  await page.getByRole("button", { name: "Catálogo", exact: true }).click()
  await expect(page.getByRole("heading", { name: /Procedimentos & Tratamentos/i })).toBeVisible()

  const main = page.locator("main[data-app-scroll-root]")
  const bodyScrollBefore = await page.evaluate(() => document.body.scrollTop)

  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })

  const scrollState = await main.evaluate((element) => ({
    top: element.scrollTop,
    maximum: element.scrollHeight - element.clientHeight,
  }))

  expect(scrollState.top).toBeGreaterThan(0)
  expect(Math.abs(scrollState.maximum - scrollState.top)).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.body.scrollTop)).toBe(bodyScrollBefore)
})
