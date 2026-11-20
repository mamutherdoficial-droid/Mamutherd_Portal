import { expect, type Page } from "@playwright/test";

export const correo = process.env.E2E_CORREO;
export const clave = process.env.E2E_CLAVE;
export const hayUsuario = Boolean(correo && clave);

export async function entrar(page: Page) {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(correo!);
  await page.getByLabel("Contraseña").fill(clave!);
  await page.getByRole("button", { name: "Entrar" }).click();
  // En desarrollo, la primera visita a /hoy compila la página: puede tardar.
  await expect(page).toHaveURL(/\/hoy$/, { timeout: 30_000 });
}

/** Nombre único por corrida para no chocar con otras pruebas. */
export function negocio(sufijo: string) {
  return `E2E ${Date.now().toString(36)} ${sufijo}`;
}
