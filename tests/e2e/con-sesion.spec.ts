import { expect, test, type Page } from "@playwright/test";

const correo = process.env.E2E_CORREO;
const clave = process.env.E2E_CLAVE;

test.skip(!correo || !clave, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");

async function entrar(page: Page) {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(correo!);
  await page.getByLabel("Contraseña").fill(clave!);
  await page.getByRole("button", { name: "Entrar" }).click();
  // En desarrollo, la primera visita a /hoy compila la página: puede tardar.
  await expect(page).toHaveURL(/\/hoy$/, { timeout: 30_000 });
}

test("entrar y ver Hoy", async ({ page }, info) => {
  await entrar(page);
  await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
  await expect(page.getByTestId("visitas-semana")).toBeVisible();

  if (info.project.name === "movil") {
    await expect(page.getByTestId("barra-inferior")).toBeVisible();
    await expect(page.getByTestId("menu-lateral")).toBeHidden();
  } else {
    await expect(page.getByTestId("menu-lateral")).toBeVisible();
    await expect(page.getByTestId("barra-inferior")).toBeHidden();
  }
  await page.screenshot({ path: `tests/capturas/hoy-${info.project.name}.png`, fullPage: true });
});

test("componentes en claro y oscuro", async ({ page }, info) => {
  await entrar(page);
  await page.goto("/componentes");
  await expect(page.getByTestId("muestrario-claro")).toBeVisible();
  await expect(page.getByTestId("muestrario-oscuro")).toBeVisible();
  await page.screenshot({ path: `tests/capturas/componentes-${info.project.name}.png`, fullPage: true });
});

test("Acerca de muestra el sello apilado", async ({ page }, info) => {
  await entrar(page);
  await page.goto("/ajustes/acerca");
  await expect(page.getByRole("img", { name: "Un producto de Mamut Herd" })).toBeVisible();
  await expect(page.getByText("© 2026 Mamut Herd")).toBeVisible();
  await page.screenshot({ path: `tests/capturas/acerca-${info.project.name}.png`, fullPage: true });
});

test("cerrar sesión y volver a Hoy manda a Entrar", async ({ page }, info) => {
  await entrar(page);
  if (info.project.name === "movil") {
    await page.goto("/mas");
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
  } else {
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
  }
  await expect(page).toHaveURL(/\/entrar/);
  await page.goto("/hoy");
  await expect(page).toHaveURL(/\/entrar/);
});
