import { expect, type Page } from "@playwright/test";

export const correo = process.env.E2E_CORREO;
export const clave = process.env.E2E_CLAVE;
export const hayUsuario = Boolean(correo && clave);

/** La ayudante de prueba: el mismo correo con "+ayudante" (misma clave). */
export function correoAyudante(base: string) {
  const [u, d] = base.split("@");
  return `${u}+ayudante@${d}`;
}

/** Cuenta sin empresa para probar invitaciones: el mismo correo con "+invitada" (misma clave). */
export function correoInvitada(base: string) {
  const [u, d] = base.split("@");
  return `${u}+invitada@${d}`;
}

export async function entrar(page: Page, como: "gerente" | "ayudante" = "gerente") {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(como === "gerente" ? correo! : correoAyudante(correo!));
  await page.getByLabel("Contraseña").fill(clave!);
  await page.getByRole("button", { name: "Entrar" }).click();
  // En desarrollo, la primera visita a /hoy compila la página: puede tardar.
  await expect(page).toHaveURL(/\/hoy$/, { timeout: 30_000 });
}

/** Nombre único por corrida para no chocar con otras pruebas. */
export function negocio(sufijo: string) {
  return `E2E ${Date.now().toString(36)} ${sufijo}`;
}

/**
 * Deja el tutorial como visto para el gerente y la ayudante de prueba (la prueba de la Guía lo
 * reinicia a propósito, y un tour abierto taparía los botones). Usa la service key solo en pruebas.
 */
export async function tutorialVisto() {
  const { createClient } = await import("@supabase/supabase-js");
  const { HOTSPOTS, RECORRIDOS } = await import("../../lib/recorridos");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !servicio || !correo) return;
  const admin = createClient(url, servicio, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: empresa } = await admin.from("empresas").select("id").eq("slug", "pruebas-e2e").single();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const ids = (data?.users ?? []).filter((u) => u.email === correo || u.email === correoAyudante(correo)).map((u) => u.id);
  const filas = ids.flatMap((u) =>
    [...RECORRIDOS, ...HOTSPOTS].map((r) => ({
      usuario_id: u,
      empresa_id: empresa!.id,
      recorrido: r.id,
      version: r.version,
      saltado: true,
    })),
  );
  const { error } = await admin.from("recorridos_vistos").upsert(filas, { onConflict: "usuario_id,empresa_id,recorrido" });
  if (error) throw error;
}
