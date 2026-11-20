import { expect, test, type Page } from "@playwright/test";
import { entrar, hayUsuario, negocio } from "./ayuda";

test.skip(!hayUsuario, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");

/** Anota una visita a un negocio nuevo contando los toques. */
async function anotarRapido(page: Page, nombre: string, fecha: "Mañana" | "En 3 días" = "Mañana") {
  let toques = 0;
  const tocar = async (l: ReturnType<Page["getByRole"]>) => {
    await l.click();
    toques++;
  };
  const hoja = page.getByTestId("form-visita");

  await tocar(page.getByRole("button", { name: "Anotar visita" })); // 1
  await hoja.getByLabel("Nombre del negocio").fill(nombre); // escribir no cuenta como toque
  await tocar(hoja.getByRole("button", { name: `Crear «${nombre}»` })); // 2
  // Producto: queda elegido el último usado (o el primero).
  await tocar(hoja.getByRole("button", { name: "Sí", exact: true })); // 3
  await tocar(hoja.getByRole("button", { name: "Interesado" })); // 4
  await tocar(hoja.getByRole("button", { name: fecha })); // 5
  await tocar(hoja.getByRole("button", { name: "Guardar" })); // 6
  await expect(page.getByRole("status").filter({ hasText: nombre })).toBeVisible({ timeout: 15_000 });
  return toques;
}

test("anotar una visita a un negocio nuevo: ≤ 6 toques y < 20 s", async ({ page }, info) => {
  await entrar(page);
  const inicio = Date.now();
  const toques = await anotarRapido(page, negocio(`rápido ${info.project.name}`));
  const segundos = (Date.now() - inicio) / 1000;
  console.log(`[${info.project.name}] anotar visita: ${toques} toques, ${segundos.toFixed(1)} s`);
  expect(toques).toBeLessThanOrEqual(6);
  expect(segundos).toBeLessThan(20);
  await page.screenshot({ path: `tests/capturas/hoy-con-visita-${info.project.name}.png`, fullPage: true });
});

test("3 visitas aparecen en Ventas y en los seguimientos de Hoy con su fecha", async ({ page }, info) => {
  await entrar(page);
  const nombres = [negocio(`uno ${info.project.name}`), negocio(`dos ${info.project.name}`), negocio(`tres ${info.project.name}`)];
  for (const n of nombres) await anotarRapido(page, n, "Mañana");

  // Hoy: en "Próximos 7 días" con "Mañana".
  await page.reload();
  const proximos = page.getByTestId("seguimientos-proximos");
  for (const n of nombres) {
    const fila = proximos.getByTestId("fila-seguimiento").filter({ hasText: n });
    await expect(fila).toBeVisible();
    await expect(fila).toContainText("Mañana");
  }
  await expect(page.getByTestId("visitas-semana")).toContainText("esta semana");

  // Ventas: en "Contactado".
  await page.goto("/ventas");
  for (const n of nombres) {
    await expect(page.getByTestId("tarjeta-oportunidad").filter({ hasText: n })).toBeVisible();
  }
  await page.screenshot({ path: `tests/capturas/ventas-${info.project.name}.png`, fullPage: true });
});

test("sin próxima fecha avisa, pero se puede guardar", async ({ page }) => {
  await entrar(page);
  const nombre = negocio("sin fecha");
  const hoja = page.getByTestId("form-visita");
  await page.getByRole("button", { name: "Anotar visita" }).click();
  await hoja.getByLabel("Nombre del negocio").fill(nombre);
  await hoja.getByRole("button", { name: `Crear «${nombre}»` }).click();
  await hoja.getByRole("button", { name: "No", exact: true }).click();
  await hoja.getByRole("button", { name: "Volver otro día" }).click();
  await expect(hoja.getByText("Sin fecha, esta venta no te va a aparecer en Hoy.")).toBeVisible();
  await hoja.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Visita anotada" })).toBeVisible({ timeout: 15_000 });

  await page.goto("/ventas");
  const tarjeta = page.getByTestId("tarjeta-oportunidad").filter({ hasText: nombre });
  await expect(tarjeta).toContainText("Sin próxima fecha");
});

test("una venta no se marca perdida sin motivo; pasar de etapa funciona", async ({ page }) => {
  await entrar(page);
  const nombre = negocio("etapas");
  await anotarRapido(page, nombre);
  await page.goto("/ventas");
  const tarjeta = page.getByTestId("tarjeta-oportunidad").filter({ hasText: nombre });

  await tarjeta.getByRole("button", { name: "Pasar a Demo" }).click();
  await expect(page.getByRole("status").filter({ hasText: `${nombre}: Demo` })).toBeVisible({ timeout: 15_000 });
  // La tarjeta se muda al grupo Demo: espera a que llegue antes de seguir.
  await expect(tarjeta.getByRole("button", { name: "Pasar a Propuesta" })).toBeVisible({ timeout: 15_000 });

  await tarjeta.getByRole("button", { name: "Perdida" }).click();
  const dialogo = page.getByRole("dialog", { name: new RegExp(`por qué se perdió`, "i") });
  await dialogo.getByRole("button", { name: "Marcar como perdida" }).click();
  // El motivo es obligatorio: sin él no se cierra.
  await expect(dialogo).toBeVisible();
  await dialogo.getByLabel("Motivo").fill("Le pareció caro");
  await dialogo.getByRole("button", { name: "Marcar como perdida" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Marcada como perdida" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Ver cerradas" }).click();
  await expect(page.getByTestId("tarjeta-oportunidad").filter({ hasText: nombre })).toContainText("Le pareció caro");
});

test("ficha del cliente: datos, historial y editar el WhatsApp", async ({ page }) => {
  await entrar(page);
  const nombre = negocio("ficha");
  await anotarRapido(page, nombre);
  await page.goto("/clientes");
  await page.getByRole("searchbox", { name: "Buscar negocio" }).fill(nombre);
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("link", { name: new RegExp(nombre) }).click();
  await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
  await expect(page.getByText("Interesado", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).click();
  const dialogo = page.getByRole("dialog", { name: "Editar negocio" });
  await dialogo.getByLabel("WhatsApp").fill("123");
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(dialogo.getByRole("alert")).toContainText("no parece un celular");
  await dialogo.getByLabel("WhatsApp").fill("320 487 1882");
  await dialogo.getByLabel("Dueño o contacto").fill("Luisa Gómez");
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("320 487 1882", { exact: true })).toBeVisible({ timeout: 15_000 });
});

test("tutorial: la bienvenida sale, Saltar la cierra y no vuelve; la guía la repite", async ({ page }, info) => {
  await entrar(page);
  await expect(page.getByTestId("bienvenida")).toBeHidden(); // ya vista (preparar.ts)

  await page.goto("/guia");
  await page.getByRole("button", { name: "Hacer el recorrido otra vez" }).click();
  await expect(page).toHaveURL(/\/hoy$/);
  const bienvenida = page.getByTestId("bienvenida");
  await expect(bienvenida).toBeVisible();
  await page.screenshot({ path: `tests/capturas/bienvenida-${info.project.name}.png` });
  await bienvenida.getByRole("button", { name: "Siguiente" }).click();
  await bienvenida.getByRole("button", { name: "Saltar" }).click();
  await expect(bienvenida).toBeHidden();

  // No vuelve a salir (se guardó en la base).
  await expect
    .poll(async () => {
      await page.reload();
      return page.getByTestId("bienvenida").isVisible();
    }, { timeout: 15_000 })
    .toBe(false);

  // El product tour de Ventas sale la primera vez y se puede saltar.
  await page.goto("/ventas");
  const tour = page.getByTestId("recorrido-ventas");
  await expect(tour).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: `tests/capturas/tour-ventas-${info.project.name}.png` });
  await page.keyboard.press("Escape");
  await expect(tour).toBeHidden();
});

test("primera visita guiada: la bienvenida lleva a anotar la visita paso a paso", async ({ page }) => {
  await entrar(page);
  await page.goto("/guia");
  await page.getByRole("button", { name: "Hacer el recorrido otra vez" }).click();
  const bienvenida = page.getByTestId("bienvenida");
  await expect(bienvenida).toBeVisible();
  await bienvenida.getByRole("button", { name: "Siguiente" }).click();
  await bienvenida.getByRole("button", { name: "Siguiente" }).click();
  await bienvenida.getByRole("button", { name: "Anotar mi primera visita" }).click();

  // Coach mark sobre el botón; al tocarlo se abre la hoja con los pasos.
  await expect(page.getByTestId("recorrido-primera-visita")).toBeVisible();
  await page.getByRole("button", { name: "Anotar visita" }).click();
  const paso = page.getByTestId("paso-guiado");
  await expect(paso).toContainText("1 de 5");
  const nombre = negocio("guiada");
  const hoja = page.getByTestId("form-visita");
  await hoja.getByLabel("Nombre del negocio").fill(nombre);
  await hoja.getByRole("button", { name: `Crear «${nombre}»` }).click();
  await expect(paso).toContainText("3 de 5");
  await hoja.getByRole("button", { name: "Sí", exact: true }).click();
  await hoja.getByRole("button", { name: "Pidió propuesta" }).click();
  await expect(paso).toContainText("5 de 5");
  await hoja.getByRole("button", { name: "En 3 días" }).click();
  await hoja.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Visita anotada" })).toBeVisible({ timeout: 15_000 });

  // Deja el tour de Ventas visto para las demás pruebas.
  await page.goto("/ventas");
  await page.getByTestId("recorrido-ventas").getByRole("button", { name: "Saltar" }).click();
});
