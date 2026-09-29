import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("samara_auth_session", "true")
  })
  await page.goto("/")
})

test("keeps customer modal header and actions reachable in a short viewport", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Clientes", exact: true }).click()
  await page.getByRole("button", { name: /Cadastrar Cliente/i }).click()

  const dialog = page.getByRole("dialog", { name: /Novo Cliente/i })
  const body = dialog.locator('[data-modal-body="true"]')
  const footer = dialog.locator('[data-modal-footer="true"]')
  const heading = dialog.getByRole("heading", { name: /Novo Cliente/i })

  await expect(dialog).toBeVisible()
  await expect(heading).toBeVisible()
  await expect(footer).toBeVisible()

  const dialogBox = await dialog.boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0)
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerHeight),
  )
  expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  )

  expect(
    await page.locator("main[data-app-scroll-root]").evaluate((element) => element.style.overflow),
  ).toBe("hidden")
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden")

  await body.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await page.getByLabel("Observações Gerais & Preferências").focus()
  await expect(footer).toBeInViewport()
  await expect(dialog.getByRole("button", { name: /Cadastrar Cliente/i })).toBeInViewport()
})

test("uses the same bounded dialog structure for procedure forms", async ({ page }) => {
  await page.getByRole("button", { name: "Catálogo", exact: true }).click()
  await page.getByRole("button", { name: /Novo Procedimento/i }).click()

  const dialog = page.getByRole("dialog", { name: /Novo Procedimento/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-modal-body="true"]')).toBeVisible()
  await expect(dialog.locator('[data-modal-footer="true"]')).toBeVisible()
  await expect(dialog.getByRole("button", { name: /Cadastrar Procedimento/i })).toBeInViewport()
})
