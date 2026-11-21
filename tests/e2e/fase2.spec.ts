import { expect, test, type Browser, type Page, type TestInfo } from "@playwright/test";
import { entrar, hayUsuario, negocio, tutorialVisto } from "./ayuda";

test.skip(!hayUsuario, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");

// La prueba de la Guía (Fase 1) reinicia el tutorial; aquí no debe tapar nada.
test.beforeEach(async () => {
  await tutorialVisto();
});

/** Primer día del mes en curso (Bogotá). */
function inicioDeMes() {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  return `${hoy.slice(0, 7)}-01`;
}

async function anotar(page: Page, nombre: string) {
  // El emulador de celular puede dejar la vista corrida y "tapar" el botón flotante; las pruebas de
  // la Fase 1 ya comprueban el toque. Aquí se activa con el teclado (mismo botón, mismo efecto).
  const hoja = page.getByTestId("form-visita");
  await page.getByRole("button", { name: "Anotar visita" }).press("Enter");
  await hoja.getByLabel("Nombre del negocio").fill(nombre);
  await hoja.getByRole("button", { name: `Crear «${nombre}»` }).click();
  await hoja.getByRole("button", { name: "Sí", exact: true }).click();
  await hoja.getByRole("button", { name: "Pidió propuesta" }).click();
  await hoja.getByRole("button", { name: "Mañana" }).click();
  await hoja.getByRole("button", { name: "Guardar" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: nombre })).toBeVisible({ timeout: 15_000 });
}

/** Sesión aparte para la ayudante (mismo tamaño de pantalla que el proyecto). */
async function comoAyudante(browser: Browser, info: TestInfo) {
  const contexto = await browser.newContext({ ...info.project.use });
  const page = await contexto.newPage();
  await entrar(page, "ayudante");
  return { page, cerrar: () => contexto.close() };
}

/** El cobro visible (tarjeta en el celular, fila de tabla en el PC). */
function cobro(page: Page, nombre: string, concepto: string) {
  return page
    .locator('[data-testid="cobro"]:visible, [data-testid="cobro-fila"]:visible')
    .filter({ hasText: nombre })
    .filter({ hasText: concepto });
}

test("venta propia de Ana: anticipo $100.000 → $25.000; pago del resto → $50.000", async ({ page, browser }, info) => {
  await entrar(page);
  const nombre = negocio(`ganada ${info.project.name}`);
  await anotar(page, nombre);

  // Asistente "Ganada": primero los vendedores.
  await page.goto("/ventas");
  const tarjeta = page.getByTestId("tarjeta-oportunidad").filter({ hasText: nombre });
  await tarjeta.getByRole("button", { name: "Ganada", exact: true }).click();
  const asistente = page.getByTestId("asistente-ganada");
  await expect(asistente).toContainText("Paso 1 de 4");
  await asistente.getByRole("button", { name: "Agregar vendedor" }).click();
  await asistente.getByLabel("Persona").selectOption({ label: "Ana E2E" });
  await asistente.getByRole("button", { name: "Guardar vendedor" }).click();
  await expect(asistente.getByTestId("vendedores-confirmar")).toContainText("Ana E2E", { timeout: 15_000 });
  await asistente.getByRole("button", { name: "Los vendedores están bien" }).click();

  // Instalación $200.000 (el plan viene elegido).
  await expect(asistente.getByLabel("Valor de la instalación")).toHaveValue("200000");
  await asistente.getByRole("button", { name: "Siguiente" }).click();

  // Mensualidad: Plan Básico desde este mes (para poder generar la de este mes).
  await asistente.getByLabel("Empieza").fill(inicioDeMes());
  await asistente.getByRole("button", { name: "Siguiente" }).click();

  // Anticipo del 50%.
  await expect(asistente).toContainText("Anticipo del 50%");
  await asistente.getByRole("button", { name: "Marcar como ganada" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Comisiones creadas: .*25\.000/ })).toBeVisible({ timeout: 15_000 });

  // Ana ve $25.000 por esta venta.
  const ana = await comoAyudante(browser, info);
  await ana.page.goto("/mis-comisiones");
  const suyas = ana.page.getByTestId("comision").filter({ hasText: nombre });
  await expect(suyas).toHaveCount(1);
  await expect(suyas).toContainText("25.000");

  // El gerente registra el resto en Cobros.
  await page.goto("/cobros");
  await page.getByRole("tab", { name: /Por cobrar/ }).click();
  const instalacion = cobro(page, nombre, "Instalación");
  await expect(instalacion).toContainText("100.000");
  await instalacion.getByRole("button", { name: /^Registrar pago/ }).click();
  const pago = page.getByTestId("form-pago");
  await expect(pago.getByLabel("¿Cuánto pagó?")).toHaveValue("100000");
  await pago.getByRole("button", { name: /^Registrar/ }).click();
  await expect(page.getByRole("status").filter({ hasText: /Pago de .*100\.000 registrado/ })).toBeVisible({ timeout: 15_000 });

  // Ana: dos comisiones de $25.000 = $50.000.
  await ana.page.reload();
  await expect(suyas).toHaveCount(2);
  await ana.cerrar();

  // La ficha del cliente muestra el saldo (solo gerente).
  await page.goto("/clientes");
  await page.getByRole("searchbox", { name: "Buscar negocio" }).fill(nombre);
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("link", { name: new RegExp(nombre) }).click();
  await expect(page.getByTestId("saldo-cliente")).toBeVisible();
  await page.screenshot({ path: `tests/capturas/ficha-saldo-${info.project.name}.png`, fullPage: true });
});

test("generar mensualidades dos veces no duplica", async ({ page }) => {
  await entrar(page);
  await page.goto("/cobros");
  const boton = page.getByRole("button", { name: /^Generar mensualidades de/ });
  await boton.click();
  await expect(page.getByRole("status").filter({ hasText: /creada|Ya estaban creadas/ })).toBeVisible({ timeout: 15_000 });
  await boton.click();
  await expect(page.getByRole("status").filter({ hasText: "Ya estaban creadas" }).last()).toBeVisible({ timeout: 15_000 });
});

test("una ayudante no ve cobros ni montos de cobros", async ({ browser }, info) => {
  const ana = await comoAyudante(browser, info);
  await expect(ana.page.getByRole("link", { name: "Cobros" })).toHaveCount(0);
  await ana.page.goto("/cobros");
  await expect(ana.page).toHaveURL(/\/hoy$/);
  await ana.page.goto("/mis-comisiones");
  await expect(ana.page.getByText("Te debemos")).toBeVisible();
  await expect(ana.page.getByTestId("saldo-cliente")).toHaveCount(0);
  await ana.page.screenshot({ path: `tests/capturas/mis-comisiones-${info.project.name}.png`, fullPage: true });
  await ana.cerrar();
});

test("Cobros: tarjetas en el celular, tabla en el PC", async ({ page }, info) => {
  await entrar(page);
  await page.goto("/cobros");
  // "Pagados" siempre tiene algo después de la venta de Ana (la instalación quedó pagada).
  await page.getByRole("tab", { name: /Pagados/ }).click();
  if (info.project.name === "pc") {
    await expect(page.getByTestId("cobros-tabla")).toBeVisible();
    await expect(page.getByTestId("cobros-tarjetas")).toBeHidden();
  } else {
    await expect(page.getByTestId("cobros-tarjetas")).toBeVisible();
    await expect(page.getByTestId("cobros-tabla")).toBeHidden();
  }
  await page.screenshot({ path: `tests/capturas/cobros-${info.project.name}.png`, fullPage: true });
});
