import { expect, test } from "@playwright/test";
import { entrar, hayUsuario, negocio, tutorialVisto } from "./ayuda";

test("portada pública: se ve sin sesión, con los 5 pasos interactivos y Entrar", async ({ browser }, info) => {
  const contexto = await browser.newContext({ ...info.project.use });
  const p = await contexto.newPage();
  await p.goto("/");
  await expect(p.getByRole("heading", { level: 1 })).toContainText("en orden");
  await p.getByRole("tab", { name: /Mueve tus ventas/ }).click();
  await expect(p.getByTestId("paso-portada")).toContainText("pasa cada venta a su siguiente etapa");
  await p.screenshot({ path: `tests/capturas/portada-${info.project.name}.png`, fullPage: true });
  await p.getByRole("link", { name: "Entrar" }).first().click();
  await expect(p).toHaveURL(/\/entrar/);
  await contexto.close();
});

test("registro cerrado sin sesión explica cómo pedir acceso", async ({ browser }, info) => {
  const contexto = await browser.newContext({ ...info.project.use });
  const p = await contexto.newPage();
  await p.goto("/registro");
  await expect(p.getByTestId("registro-cerrado")).toContainText("todavía no está abierto");
  await contexto.close();
});

test.describe("con sesión", () => {
  test.skip(!hayUsuario, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");
  test.beforeEach(async () => {
    await tutorialVisto();
  });

  test("con sesión, la portada lleva a Hoy", async ({ page }) => {
    await entrar(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/hoy$/);
  });

  test("un gerente crea otra empresa con plantilla y vuelve con el selector", async ({ page }, info) => {
    await entrar(page);
    const nombre = negocio(`Registro ${info.project.name}`);
    await page.goto("/ajustes");
    await page.getByRole("link", { name: "Crear otra empresa" }).click();
    const form = page.getByTestId("form-registro");
    await form.getByLabel("Nombre del negocio").fill(nombre);
    await form.getByLabel("Tu nombre").fill("Prueba Automática");
    await form.getByRole("button", { name: /Servicio con mensualidad/ }).click();
    await form.getByRole("button", { name: "Crear empresa" }).press("Enter");
    await expect(page).toHaveURL(/\/hoy$/, { timeout: 30_000 });

    // Está en la empresa nueva, con la bienvenida del gerente (tutorial nuevo para esa empresa).
    const bienvenida = page.getByTestId("bienvenida");
    await expect(bienvenida).toBeVisible({ timeout: 15_000 });
    await bienvenida.getByRole("button", { name: "Saltar" }).click();
    await expect(bienvenida).toBeHidden();
    await page.goto("/ajustes");
    const lista = page.getByTestId("empresas");
    await expect(lista.locator("li").filter({ hasText: nombre })).toContainText("Estás aquí");

    // Vuelve a la empresa de pruebas.
    await lista.locator("li").filter({ hasText: "Pruebas e2e" }).getByRole("button", { name: "Usar esta" }).click();
    await expect(page).toHaveURL(/\/hoy$/, { timeout: 15_000 });
    await page.goto("/ajustes");
    await expect(page.getByTestId("empresas").locator("li").filter({ hasText: "Pruebas e2e" })).toContainText("Estás aquí");
  });

  test("importar clientes desde CSV no duplica y exportar los descarga", async ({ page }, info) => {
    await entrar(page);
    const a = negocio(`Importado A ${info.project.name}`);
    const b = negocio(`Importado B ${info.project.name}`);
    const csv = { name: "clientes.csv", mimeType: "text/csv", buffer: Buffer.from(`Negocio;Barrio;Celular\n${a};Chapinero;3204871882\n${b};Suba;\n;Sin nombre;\n`, "utf8") };
    await page.goto("/clientes");
    const caja = page.getByTestId("importar-exportar");
    await caja.locator("summary").click();
    await caja.getByLabel(/Importar desde un .csv/).setInputFiles(csv);
    await caja.getByRole("button", { name: "Importar clientes" }).press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "2 clientes importados" })).toBeVisible({ timeout: 15_000 });
    await caja.getByLabel(/Importar desde un .csv/).setInputFiles(csv);
    await caja.getByRole("button", { name: "Importar clientes" }).press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Esos clientes ya estaban" })).toBeVisible({ timeout: 15_000 });

    const descarga = page.waitForEvent("download");
    await caja.getByRole("button", { name: /Exportar clientes/ }).click();
    const d = await descarga;
    expect(d.suggestedFilename()).toMatch(/^clientes-.*\.csv$/);
    const texto = Buffer.concat(await (async () => { const s = await d.createReadStream(); const partes: Buffer[] = []; for await (const c of s) partes.push(c as Buffer); return partes; })()).toString("utf8");
    expect(texto).toContain(a);
    expect(texto).toContain("320 487 1882");
  });

  test("una ayudante no ve importar ni exportar", async ({ browser }, info) => {
    const contexto = await browser.newContext({ ...info.project.use });
    const ana = await contexto.newPage();
    await entrar(ana, "ayudante");
    await ana.goto("/clientes");
    await expect(ana.getByTestId("importar-exportar")).toHaveCount(0);
    await contexto.close();
  });
});
