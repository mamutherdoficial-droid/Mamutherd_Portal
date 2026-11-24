import { expect, test, type Page } from "@playwright/test";
import { borrarRutasPrueba, entrar, hayUsuario, negocio, tutorialVisto } from "./ayuda";

test.skip(!hayUsuario, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");

// GPS simulado en Chapinero (Bogotá), con permiso.
const AQUI = { latitude: 4.6272, longitude: -74.0682 };
test.use({ geolocation: AQUI, permissions: ["geolocation"] });

test.beforeEach(async () => {
  await tutorialVisto();
  await borrarRutasPrueba();
});

async function completarVisita(page: Page) {
  const hoja = page.getByTestId("form-visita");
  await hoja.getByRole("button", { name: "Sí", exact: true }).click();
  await hoja.getByRole("button", { name: "Interesado" }).click();
  await hoja.getByRole("button", { name: "Mañana" }).click();
  await hoja.getByRole("button", { name: "Guardar" }).press("Enter");
}

test("anotar una visita con «Estoy en el negocio» pone el negocio en el mapa de ventas", async ({ page }, info) => {
  await entrar(page);
  const nombre = negocio(`GPS ${info.project.name}`);
  const hoja = page.getByTestId("form-visita");
  await page.getByRole("button", { name: "Anotar visita" }).press("Enter");
  await hoja.getByLabel("Nombre del negocio").fill(nombre);
  await hoja.getByRole("button", { name: `Crear «${nombre}»` }).click();
  await expect(hoja.getByRole("switch", { name: /Estoy en el negocio/ })).toBeChecked();
  await completarVisita(page);
  await expect(page.getByRole("status").filter({ hasText: `${nombre} quedó en el mapa` })).toBeVisible({ timeout: 20_000 });

  await page.goto("/ventas?vista=mapa");
  await expect(page.getByTestId("ventas-mapa")).toBeVisible();
  const pin = page.getByRole("button", { name: nombre, exact: true });
  await expect(pin).toBeAttached({ timeout: 20_000 });
  await pin.dispatchEvent("click");
  await expect(page.getByTestId("tarjeta-pin")).toContainText(nombre);
  await page.screenshot({ path: `tests/capturas/ventas-mapa-${info.project.name}.png` });
});

test("ruta: pegar 4 lugares, ordenar sin alargar y anotar el primero pasa al segundo", async ({ page }, info) => {
  await entrar(page);
  const sufijo = info.project.name;
  // Desordenados a propósito a lo largo de la Cra 13.
  const lugares = [
    [`E2E Ruta A ${sufijo}`, "4.6487, -74.0627"],
    [`E2E Ruta B ${sufijo}`, "4.6280, -74.0675"],
    [`E2E Ruta C ${sufijo}`, "4.6440, -74.0636"],
    [`E2E Ruta D ${sufijo}`, "4.6336, -74.0660"],
  ];
  await page.goto("/ruta");
  await expect(page.getByTestId("arma-tu-ruta")).toBeVisible();
  await page.getByRole("button", { name: "Pegar lugares" }).click();
  const form = page.getByTestId("form-lugares");
  await form.getByLabel("Lugares").fill(lugares.map(([n, c]) => `${n} | ${c}`).join("\n"));
  await form.getByRole("button", { name: "Agregar a la ruta de hoy" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "4 lugares agregados" })).toBeVisible({ timeout: 20_000 });

  await expect(page.getByTestId("parada")).toHaveCount(4, { timeout: 20_000 });
  await expect(page.getByTestId("avance-ruta")).toContainText("0 de 4 visitas");

  // Ordenar por cercanía desde el GPS: el recorrido no se alarga.
  await page.getByRole("button", { name: "Ordenar por cercanía" }).click();
  const aviso = page.getByRole("status").filter({ hasText: "Ruta ordenada" });
  await expect(aviso).toBeVisible({ timeout: 20_000 });
  const texto = (await aviso.textContent()) ?? "";
  const [despues, antes] = [...texto.matchAll(/([\d,]+) km/g)].map((m) => Number(m[1]!.replace(",", ".")));
  expect(despues).toBeLessThanOrEqual(antes ?? Infinity);
  // Desde Chapinero bajo, la más cercana es la B (calle 39).
  const siguiente = page.getByTestId("siguiente");
  await expect(siguiente).toContainText(`E2E Ruta B ${sufijo}`, { timeout: 20_000 });
  await page.screenshot({ path: `tests/capturas/ruta-${info.project.name}.png` });

  // Anotar la visita del primero: la parada queda hecha y «Siguiente» pasa al segundo, sin recargar.
  await page.getByRole("button", { name: "Anota la visita" }).click();
  await completarVisita(page);
  await expect(page.getByTestId("avance-ruta")).toContainText("1 de 4 visitas", { timeout: 20_000 });
  await expect(siguiente).toContainText(`E2E Ruta D ${sufijo}`);
  await expect(page.getByRole("link", { name: "Ir", exact: true })).toHaveAttribute("href", /google\.com\/maps\/dir/);
});

test("Hoy muestra la tarjeta de la ruta", async ({ page }) => {
  await entrar(page);
  await expect(page.getByTestId("hoy-ruta")).toContainText(/Arma tu ruta|Tu ruta de hoy/);
});
