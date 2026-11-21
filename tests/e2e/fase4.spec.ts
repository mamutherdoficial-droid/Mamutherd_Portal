import { expect, test, type Page } from "@playwright/test";
import { clienteGanado, entrar, hayUsuario, negocio, tutorialVisto } from "./ayuda";

test.skip(!hayUsuario, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");

test.beforeEach(async () => {
  await tutorialVisto();
});

async function stockDe(page: Page, nombre: string) {
  const t = await page.getByTestId("item-inventario").filter({ hasText: nombre }).getByTestId("stock").textContent();
  return Number(t);
}

test("comprar 50 stickers e instalar 7 → +43; por debajo de 20 avisa", async ({ page }, info) => {
  const cliente = negocio(`instalado ${info.project.name}`);
  await clienteGanado(cliente);
  await entrar(page);
  await page.goto("/inventario");
  const sticker = page.getByTestId("item-inventario").filter({ hasText: "Sticker NFC NTAG213" });
  const antes = await stockDe(page, "Sticker NFC NTAG213");

  // Compra de 50.
  await sticker.getByRole("button", { name: "Compra" }).click();
  const mov = page.getByTestId("form-movimiento");
  await mov.getByLabel("¿Cuántas compraste?").fill("50");
  await mov.getByLabel("Costo total (opcional)").fill("50000");
  await mov.getByRole("button", { name: "Guardar" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Compra registrada" })).toBeVisible({ timeout: 15_000 });
  await expect(sticker.getByTestId("stock")).toHaveText(String(antes + 50));

  // Instalación en el cliente: propone 7 stickers, 6 soportes y 1 placa.
  await page.getByRole("button", { name: "Registrar instalación" }).click();
  const inst = page.getByTestId("form-instalacion");
  await inst.getByRole("button", { name: cliente }).click();
  await expect(inst.getByLabel(/Sticker NFC NTAG213/)).toHaveValue("7");
  await inst.getByLabel(/Soporte acrílico/).fill("0");
  await inst.getByLabel(/Placa de caja/).fill("0");
  await inst.getByRole("button", { name: "Registrar instalación" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Instalación registrada" })).toBeVisible({ timeout: 15_000 });
  await expect(sticker.getByTestId("stock")).toHaveText(String(antes + 43));
  if (antes === 0) await expect(sticker.getByTestId("stock")).toHaveText("43");
  await expect(page.getByTestId("alerta-stock")).not.toContainText("Sticker");

  // Daño hasta quedar en 15 → alerta de stock bajo (mínimo 20).
  await sticker.getByRole("button", { name: "Daño" }).click();
  await mov.getByLabel("¿Cuántas se dañaron?").fill(String(antes + 43 - 15));
  await mov.getByRole("button", { name: "Guardar" }).press("Enter");
  await expect(sticker.getByTestId("stock")).toHaveText("15", { timeout: 15_000 });
  await expect(page.getByTestId("alerta-stock")).toContainText("Sticker NFC NTAG213 (15)");
  await page.screenshot({ path: `tests/capturas/inventario-${info.project.name}.png`, fullPage: true });

  // Hoy también lo avisa.
  await page.goto("/hoy");
  await expect(page.getByTestId("hoy-plata")).toContainText("Stock bajo");
});

test("la meta de visitas sube sola al anotar una visita", async ({ page }, info) => {
  await entrar(page);
  await page.goto("/metas");
  const form = page.getByTestId("form-metas");
  await form.getByRole("button", { name: "Esta semana" }).click();
  await form.getByRole("button", { name: "Toda la empresa" }).click();
  await form.getByLabel("Visitas").fill("500");
  await form.getByRole("button", { name: "Guardar metas" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Metas guardadas" })).toBeVisible({ timeout: 15_000 });

  await page.goto("/hoy");
  const meta = page.getByTestId("hoy-metas").getByTestId("meta-visitas");
  await expect(meta).toContainText("de 500");
  const antes = Number((await meta.locator("strong").textContent()) ?? "0");

  const nombre = negocio(`meta ${info.project.name}`);
  const hoja = page.getByTestId("form-visita");
  await page.getByRole("button", { name: "Anotar visita" }).press("Enter");
  await hoja.getByLabel("Nombre del negocio").fill(nombre);
  await hoja.getByRole("button", { name: `Crear «${nombre}»` }).click();
  await hoja.getByRole("button", { name: "Sí", exact: true }).click();
  await hoja.getByRole("button", { name: "Interesado" }).click();
  await hoja.getByRole("button", { name: "Mañana" }).click();
  await hoja.getByRole("button", { name: "Guardar" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: nombre })).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await expect(meta.locator("strong")).toHaveText(String(antes + 1));
  await page.screenshot({ path: `tests/capturas/hoy-completo-${info.project.name}.png`, fullPage: true });
});

test("/semana carga en menos de 1 s", async ({ page }, info) => {
  await entrar(page);
  await page.goto("/semana");
  await expect(page.getByTestId("semana-cifras")).toBeVisible();
  const ms = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return n.responseEnd - n.requestStart;
  });
  console.log(`[${info.project.name}] /semana respondió en ${Math.round(ms)} ms`);
  expect(ms).toBeLessThan(1000);
  await page.screenshot({ path: `tests/capturas/semana-${info.project.name}.png`, fullPage: true });
});

test("una ayudante no abre Inventario ni el resumen (vuelve a Hoy)", async ({ browser }, info) => {
  const contexto = await browser.newContext({ ...info.project.use });
  const ana = await contexto.newPage();
  await entrar(ana, "ayudante");
  for (const ruta of ["/inventario", "/semana"]) {
    await ana.goto(ruta);
    await expect(ana).toHaveURL(/\/hoy$/);
  }
  await ana.goto("/metas");
  await expect(ana.getByTestId("form-metas")).toHaveCount(0);
  await contexto.close();
});
