import { expect, test } from "@playwright/test";

test.describe("sin sesión", () => {
  for (const ruta of ["/hoy", "/componentes", "/ajustes/acerca", "/mas"]) {
    test(`${ruta} manda a Entrar`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/entrar(\?|$)/);
      expect(new URL(page.url()).searchParams.get("siguiente")).toBe(ruta);
    });
  }

  test("Entrar muestra la marca de Mamut y el formulario", async ({ page }, info) => {
    await page.goto("/entrar");
    await expect(page.getByRole("img", { name: "Mamut Herd" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Portal Mamut" })).toBeVisible();
    await expect(page.getByLabel("Correo")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Ver" }).click();
    await expect(page.getByLabel("Contraseña")).toHaveAttribute("type", "text");
    await page.screenshot({ path: `tests/capturas/entrar-${info.project.name}.png`, fullPage: true });
  });

  test("Entrar avisa qué hacer si el correo está incompleto", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill("jacobo@");
    await page.getByLabel("Contraseña").fill("algo");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Escribe tu correo completo")).toBeVisible();
  });

  test("el logo cambia con el tema oscuro", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/entrar");
    const logo = page.locator('img[data-logo="horizontal"]');
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain("para-fondo-oscuro");

    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain("para-fondo-claro");
  });

  test("Olvidé mi contraseña pide el correo", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByRole("button", { name: "Olvidé mi contraseña" }).click();
    await expect(page.getByRole("button", { name: "Mandar enlace" })).toBeVisible();
  });

  test("el manifest de la PWA dice Portal Mamut", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.name).toBe("Portal Mamut");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
