import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Variables locales para las pruebas (nunca se suben a git): .env.local y .env.test.local
for (const archivo of [".env.local", ".env.test.local"]) {
  if (existsSync(archivo)) process.loadEnvFile(archivo);
}

const PUERTO = 3100;
const BASE = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  timeout: 60_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./tests/e2e/preparar.ts",
  use: {
    baseURL: BASE,
    locale: "es-CO",
    timezoneId: "America/Bogota",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "movil",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "pc",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: process.env.CI ? `pnpm start -p ${PUERTO}` : `pnpm dev -p ${PUERTO}`,
    url: `${BASE}/entrar`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
