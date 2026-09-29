import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("samara_auth_session", "true")
  })
})

test("formats customer contact fields and restricts the city to Alagoas", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Clientes", exact: true }).click()
  await page.getByRole("button", { name: /Cadastrar Cliente/i }).click()

  const dialog = page.getByRole("dialog", { name: /Novo Cliente/i })
  const cpf = page.getByLabel("CPF *")
  const phone = page.getByLabel("Telefone / WhatsApp *")
  const city = page.getByLabel("Cidade / UF *")

  await expect(dialog).toBeVisible()
  await cpf.fill("12345678901")
  await expect(cpf).toHaveValue("123.456.789-01")
  await phone.fill("82987654321")
  await expect(phone).toHaveValue("(82) 98765-4321")
  await expect(city).toHaveValue("Maceió, AL")
  await expect(city.locator("option")).toHaveCount(102)
  await city.selectOption("Arapiraca, AL")
  await expect(city).toHaveValue("Arapiraca, AL")
})

test("keeps the form open while CPF or phone is incomplete", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Clientes", exact: true }).click()
  await page.getByRole("button", { name: /Cadastrar Cliente/i }).click()

  const dialog = page.getByRole("dialog", { name: /Novo Cliente/i })
  const cpf = page.getByLabel("CPF *")
  const phone = page.getByLabel("Telefone / WhatsApp *")

  await page.getByLabel("Nome Completo *").fill("Cliente Teste")
  await cpf.fill("123456")
  await phone.fill("829876")

  expect(await cpf.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false)
  expect(await phone.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false)

  await page
    .getByRole("button", { name: /Cadastrar Cliente/i })
    .last()
    .evaluate((button: HTMLButtonElement) => button.click())
  await expect(dialog).toBeVisible()
})
