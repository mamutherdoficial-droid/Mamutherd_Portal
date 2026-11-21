import { expect, test, type Browser, type TestInfo } from "@playwright/test";
import { clave, correo, correoInvitada, entrar, hayUsuario, negocio, tutorialVisto } from "./ayuda";

test.skip(!hayUsuario, "Falta E2E_CORREO / E2E_CLAVE (ver tests/e2e/preparar.ts)");

test.beforeEach(async () => {
  await tutorialVisto();
});

async function comoAyudante(browser: Browser, info: TestInfo) {
  const contexto = await browser.newContext({ ...info.project.use });
  const page = await contexto.newPage();
  await entrar(page, "ayudante");
  return { page, cerrar: () => contexto.close() };
}

test("tarea de fotos: el gerente la asigna, Ana la marca hecha y aparece en Por pagar", async ({ page, browser }, info) => {
  await entrar(page);
  const titulo = negocio(`fotos ${info.project.name}`);

  await page.goto("/tareas");
  await page.getByRole("button", { name: "Nueva tarea" }).click();
  const form = page.getByTestId("form-tarea");
  await form.getByLabel("¿Qué hay que hacer?").fill(titulo);
  await form.getByRole("button", { name: "Fotos", exact: true }).click();
  await form.getByLabel("¿Para quién?").selectOption({ label: "Ana E2E" });
  await form.getByLabel("Valor del trabajo (opcional)").fill("80000");
  await form.getByRole("button", { name: "Asignar tarea" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Tarea asignada" })).toBeVisible({ timeout: 15_000 });

  // Ana la ve en sus tareas y la marca hecha.
  const ana = await comoAyudante(browser, info);
  await ana.page.goto("/tareas");
  await expect(ana.page.getByRole("heading", { name: "Mis tareas" })).toBeVisible();
  await ana.page.getByRole("button", { name: `Marcar hecha «${titulo}»` }).press("Enter");
  await expect(ana.page.getByRole("status").filter({ hasText: "¡Hecha!" })).toBeVisible({ timeout: 15_000 });
  await ana.page.screenshot({ path: `tests/capturas/mis-tareas-${info.project.name}.png`, fullPage: true });
  await ana.cerrar();

  // El gerente la ve por pagar en la ficha de Ana.
  await page.goto("/equipo");
  await page.getByTestId("persona-equipo").filter({ hasText: "Ana E2E" }).click();
  await expect(page.getByTestId("por-pagar")).toContainText(titulo);
  await expect(page.getByTestId("acuerdos")).toContainText("25%");
});

test("una ayudante no abre Cobros ni Equipo (vuelve a Hoy) y no los ve en el menú", async ({ browser }, info) => {
  const ana = await comoAyudante(browser, info);
  for (const ruta of ["/cobros", "/equipo"]) {
    await ana.page.goto(ruta);
    await expect(ana.page).toHaveURL(/\/hoy$/);
  }
  await expect(ana.page.getByRole("link", { name: "Cobros" })).toHaveCount(0);
  await expect(ana.page.getByRole("link", { name: "Equipo" })).toHaveCount(0);
  await ana.cerrar();
});

test("invitar: el gerente crea el enlace y la invitada se une con su contraseña", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "movil", "Una vez basta: la cuenta invitada se vincula una sola vez por corrida");
  await entrar(page);
  const nombre = negocio("Invitada");

  await page.goto("/equipo");
  await page.getByRole("button", { name: "Agregar persona" }).click();
  const form = page.getByTestId("form-persona");
  await form.getByLabel("Nombre").fill(nombre);
  await form.getByLabel("Correo").fill(correoInvitada(correo!));
  await form.getByRole("button", { name: "Agregar al equipo" }).press("Enter");
  await expect(page.getByRole("heading", { name: nombre })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Invitar al portal" }).press("Enter");
  const enlace = (await page.getByTestId("enlace-invitacion").textContent())!.trim();
  expect(enlace).toMatch(/\/unirme\?token=[0-9a-f]{64}$/);

  // La invitada abre el enlace sin sesión y entra con su cuenta.
  const contexto = await browser.newContext({ ...info.project.use });
  const invitada = await contexto.newPage();
  await invitada.goto(enlace.replace(/^https?:\/\/[^/]+/, ""));
  await expect(invitada.getByRole("heading", { name: "Únete al equipo" })).toBeVisible();
  await invitada.getByRole("button", { name: "Ya tengo cuenta" }).click();
  const f = invitada.getByTestId("form-unirme");
  await f.getByLabel("Tu correo").fill(correoInvitada(correo!));
  await f.getByLabel("Contraseña").fill(clave!);
  await f.getByRole("button", { name: "Entrar y unirme" }).press("Enter");
  await expect(invitada).toHaveURL(/\/hoy$/, { timeout: 30_000 });
  // Ve su propio tutorial (la bienvenida de ayudante).
  await expect(invitada.getByTestId("bienvenida")).toBeVisible({ timeout: 15_000 });
  await expect(invitada.getByTestId("bienvenida")).toContainText("Bienvenida a Portal Mamut");
  await invitada.screenshot({ path: `tests/capturas/bienvenida-ayudante-${info.project.name}.png` });

  // El mismo enlace ya no sirve.
  await invitada.goto(enlace.replace(/^https?:\/\/[^/]+/, ""));
  await invitada.getByRole("button", { name: "Unirme al equipo" }).click();
  await expect(invitada.getByRole("alert").filter({ hasText: /ya se usó|ya no sirve|ya es parte/ })).toBeVisible();
  await contexto.close();

  // En /equipo ya no dice "sin acceso".
  await page.goto("/equipo");
  await expect(page.getByTestId("persona-equipo").filter({ hasText: nombre })).not.toContainText("sin acceso");
});

test("/unirme con un enlace roto explica qué hacer", async ({ browser }, info) => {
  const contexto = await browser.newContext({ ...info.project.use });
  const p = await contexto.newPage();
  await p.goto("/unirme?token=roto");
  await expect(p.getByRole("alert").filter({ hasText: "Este enlace no está completo" })).toBeVisible();
  await contexto.close();
});
