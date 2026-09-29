import { defineConfig, devices } from "@playwright/test"

const mobileProjects = [
  { name: "mobile-320", viewport: { width: 320, height: 568 } },
  { name: "mobile-375", viewport: { width: 375, height: 812 } },
  { name: "mobile-390", viewport: { width: 390, height: 844 } },
  { name: "mobile-430", viewport: { width: 430, height: 932 } },
]

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "msedge",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: mobileProjects.map(({ name, viewport }) => ({
    name,
    use: {
      ...devices["Desktop Chrome"],
      channel: "msedge",
      viewport,
      isMobile: true,
      hasTouch: true,
    },
  })),
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
