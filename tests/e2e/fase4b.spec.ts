import { expect, test, type Page } from "@playwright/test";
import { clienteConCobro, entrar, hayUsuario, negocio, tutorialVisto } from "./ayuda";

test.skip(!hayUsuario, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");

test.beforeEach(async () => {
  await tutorialVisto();
});

/** Un extracto de Nequi inventado con un ingreso del negocio dado. */
function extracto(nombre: string, valor: number) {
  const hoy = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Bogota" }).format(new Date()); // dd/mm/aaaa
  const texto = `Fecha;Descripción;Referencia;Valor\n${hoy};Recibí de ${nombre.toUpperCase()};R${valor};$ ${valor.toLocaleString("es-CO")}\n${hoy};Envío a Juan;R1;-$ 20.000\n`;
  return { name: `nequi-${valor}.csv`, mimeType: "text/csv", buffer: Buffer.from(texto, "utf8") };
}

/** El movimiento cuya DESCRIPCIÓN dice el texto (las listas de cobros de otros movimientos no cuentan). */
function movimiento(page: Page, texto: string) {
  return page.getByTestId("movimiento").filter({ has: page.locator("p", { hasText: texto }) });
}

async function subir(page: Page, archivo: ReturnType<typeof extracto>) {
  const panel = page.getByTestId("conciliar");
  await panel.getByRole("button", { name: "Nequi" }).click();
  await panel.getByLabel("Extracto (.csv o .xlsx)").setInputFiles(archivo);
  await panel.getByRole("button", { name: "Subir extracto" }).press("Enter");
}

test("subir un extracto, confirmar la propuesta y el cobro queda pagado", async ({ page }, info) => {
  const nombre = negocio(`Heladería ${info.project.name}`);
  const valor = 100_000 + Math.floor(Math.random() * 900) * 100; // único por corrida
  await clienteConCobro(nombre, valor);
  await entrar(page);
  await page.goto("/cobros/conciliar");

  await subir(page, extracto(nombre, valor));
  await expect(page.getByRole("status").filter({ hasText: "1 ingreso nuevo para revisar" })).toBeVisible({ timeout: 15_000 });

  const mov = movimiento(page, nombre.toUpperCase());
  await expect(mov).toContainText("Coincide valor y nombre");
  await expect(mov).toContainText(nombre);
  await page.screenshot({ path: `tests/capturas/conciliar-${info.project.name}.png`, fullPage: true });
  await mov.getByRole("button", { name: "Confirmar" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Pago registrado" })).toBeVisible({ timeout: 15_000 });
  await expect(mov).toHaveCount(0);

  // El cobro aparece pagado.
  await page.goto("/cobros");
  await page.getByRole("tab", { name: /Pagados/ }).click();
  await expect(page.locator('[data-testid="cobro"]:visible, [data-testid="cobro-fila"]:visible').filter({ hasText: nombre })).toBeVisible();
});

test("subir el mismo archivo dos veces → «Esos movimientos ya estaban»", async ({ page }, info) => {
  const nombre = negocio(`Repetido ${info.project.name}`);
  const archivo = extracto(nombre, 77_700);
  await entrar(page);
  await page.goto("/cobros/conciliar");
  await subir(page, archivo);
  await expect(page.getByRole("status").filter({ hasText: /ingreso nuevo/ })).toBeVisible({ timeout: 15_000 });
  await subir(page, archivo);
  await expect(page.getByRole("status").filter({ hasText: "Esos movimientos ya estaban" })).toBeVisible({ timeout: 15_000 });
  // Ignorarlo lo quita de la lista.
  const mov = movimiento(page, nombre.toUpperCase());
  await mov.getByRole("button", { name: "Ignorar" }).press("Enter");
  await expect(mov).toHaveCount(0, { timeout: 15_000 });
});

test("en el PC el panel está al lado de la tabla de cobros", async ({ page }, info) => {
  test.skip(info.project.name !== "pc", "Solo PC");
  await entrar(page);
  await page.goto("/cobros");
  await expect(page.getByTestId("conciliar")).toBeVisible();
});

test("un extracto .xlsx de Bancolombia también se lee en el servidor", async ({ page }) => {
  await entrar(page);
  await page.goto("/cobros/conciliar");
  const panel = page.getByTestId("conciliar");
  await panel.getByRole("button", { name: "Bancolombia" }).click();
  await panel.getByLabel("Extracto (.csv o .xlsx)").setInputFiles("tests/fixtures/extractos/bancolombia.xlsx");
  await panel.getByRole("button", { name: "Subir extracto" }).press("Enter");
  // La primera corrida los crea; la segunda (otro proyecto) dice que ya estaban.
  await expect(page.getByRole("status").filter({ hasText: /2 ingresos nuevos|ya estaban/ })).toBeVisible({ timeout: 15_000 });
  await expect(movimiento(page, "ABONO CAFE LUNA")).toBeVisible();
});
