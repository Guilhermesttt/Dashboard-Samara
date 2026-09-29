import { expect, type Page, test } from "@playwright/test"

const patient = {
  id: "pat-mobile-test",
  name: "Paciente com Nome Comprido para Teste",
  cpf: "123.456.789-01",
  phone: "(82) 98765-4321",
  email: "paciente@example.com",
  birthDate: "15/05/1994",
  age: 32,
  gender: "Feminino",
  location: "Maceió, AL",
  profession: "Profissional",
  status: "Ativo",
  totalSpent: 1800,
  proceduresCount: 2,
  lastProcedureDate: "Hoje",
  activeProcedures: ["botox"],
  proceduresHistory: [],
}

const appointment = {
  id: "apt-mobile-test",
  patientName: patient.name,
  patientPhone: patient.phone,
  procedureName: "Bioestimulador de Colágeno",
  category: "Facial/Corporal",
  type: "Aplicação",
  date: "Hoje",
  time: "14:30",
  value: 1800,
  status: "agendado",
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ patientData, appointmentData }) => {
      localStorage.setItem("samara_auth_session", "true")
      localStorage.setItem("samara_real_patients", JSON.stringify([patientData]))
      localStorage.setItem("samara_real_appointments", JSON.stringify([appointmentData]))
    },
    { patientData: patient, appointmentData: appointment },
  )
  await page.goto("/")
})

async function openSection(page: Page, section: string) {
  const bottomNav: Record<string, string> = {
    appointments: "Agenda",
    customers: "Clientes",
    procedures: "Catálogo",
  }

  if (section === "overview") return

  if (bottomNav[section]) {
    await page.getByRole("button", { name: bottomNav[section], exact: true }).click()
  } else {
    await page.getByRole("button", { name: "Mais", exact: true }).click()
    const label = section === "reports" ? "Relatórios" : "Configurações"
    await page.getByRole("button", { name: label, exact: true }).click()
  }

  await expect(page.locator(`[data-dashboard-section="${section}"]`)).toBeVisible()
}

test("contains every primary section inside the mobile viewport", async ({ page }) => {
  for (const section of [
    "overview",
    "appointments",
    "customers",
    "procedures",
    "reports",
    "settings",
  ]) {
    await openSection(page, section)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => window.innerWidth),
    )

    const mainBox = await page.locator("main[data-app-scroll-root]").boundingBox()
    const sectionBox = await page
      .locator(`[data-dashboard-section="${section}"]`)
      .boundingBox()
    expect(mainBox).not.toBeNull()
    expect(sectionBox).not.toBeNull()
    expect(sectionBox!.x).toBeGreaterThanOrEqual(mainBox!.x - 1)
    expect(sectionBox!.x + sectionBox!.width).toBeLessThanOrEqual(
      mainBox!.x + mainBox!.width + 1,
    )
  }
})

test("keeps customer and procedure actions complete and touchable", async ({ page }) => {
  await openSection(page, "customers")
  for (const action of ["Anamnese", "Ver Prontuário"]) {
    const box = await page.getByRole("button", { name: action, exact: true }).first().boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    )
  }

  await openSection(page, "procedures")
  const procedureActions = [
    page.getByRole("button", { name: "Editar", exact: true }).first(),
    page.getByTitle("Excluir procedimento").first(),
  ]
  for (const action of procedureActions) {
    const box = await action.boundingBox()
    expect(box).not.toBeNull()
    expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(44)
  }
})

test("contains settings tabs and the report export action", async ({ page }) => {
  await openSection(page, "settings")
  expect(
    await page
      .locator('[data-dashboard-section="settings"]')
      .evaluate((element) => getComputedStyle(element).userSelect),
  ).not.toBe("none")
  const tabs = page.locator('[data-settings-tabs="true"]')
  await expect(tabs).toBeVisible()
  expect(
    await tabs.evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => window.innerWidth),
  )

  await openSection(page, "reports")
  const exportButton = page.getByRole("button", { name: /Exportar Relatório PDF/i })
  const box = await exportButton.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThan(0)
  expect(box!.x + box!.width).toBeLessThan(
    await page.evaluate(() => window.innerWidth),
  )
})

test("keeps the appointment board as an internal horizontal scroller", async ({ page }) => {
  await openSection(page, "appointments")
  const board = page.locator('[data-kanban-board="true"]')
  await expect(board).toBeVisible()
  expect(await board.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => window.innerWidth),
  )
})
