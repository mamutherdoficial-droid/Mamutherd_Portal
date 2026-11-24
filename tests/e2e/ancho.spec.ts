import { expect, test } from "@playwright/test";
import { entrar, hayUsuario, tutorialVisto } from "./ayuda";

test.skip(!hayUsuario, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");

// Regresión (D-049): ninguna página puede ser más ancha que la pantalla del celular.
// Si algo se sale, el navegador corre la vista y los toques caen desplazados.
const RUTAS = ["/hoy", "/ventas", "/ventas?vista=mapa", "/clientes", "/ruta", "/cobros", "/equipo", "/tareas", "/inventario", "/metas", "/semana", "/ajustes", "/guia"];

test("en el celular ninguna página se sale del ancho de la pantalla", async ({ page }, info) => {
  test.skip(info.project.name !== "movil", "Solo celular");
  await tutorialVisto();
  await entrar(page);
  const ancho = info.project.use.viewport?.width ?? 390;
  const anchas: string[] = [];
  for (const ruta of RUTAS) {
    await page.goto(ruta);
    await page.waitForLoadState("networkidle").catch(() => {});
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > ancho) anchas.push(`${ruta} (${w}px)`);
  }
  expect(anchas, `Páginas más anchas que ${ancho}px`).toEqual([]);
});
