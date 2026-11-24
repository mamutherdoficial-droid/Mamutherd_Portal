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

/** Cliente con una venta ganada en la empresa de pruebas (para inventario), sin pasar por la interfaz. */
export async function clienteGanado(nombre: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: empresa } = await admin.from("empresas").select("id").eq("slug", "pruebas-e2e").single();
  const { data: nef } = await admin.from("productos").select("id").eq("empresa_id", empresa!.id).eq("nombre", "Nef").single();
  const { data: cli, error } = await admin.from("clientes").insert({ empresa_id: empresa!.id, nombre_negocio: nombre }).select("id").single();
  if (error) throw error;
  const { error: e2 } = await admin
    .from("oportunidades")
    .insert({ empresa_id: empresa!.id, cliente_id: cli.id, producto_id: nef!.id, etapa: "ganada" });
  if (e2) throw e2;
}

/** Cliente ganado con un cobro de instalación pendiente por `valor` (para conciliar). */
export async function clienteConCobro(nombre: string, valor: number) {
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: empresa } = await admin.from("empresas").select("id").eq("slug", "pruebas-e2e").single();
  const { data: nef } = await admin.from("productos").select("id").eq("empresa_id", empresa!.id).eq("nombre", "Nef").single();
  const { data: cli, error } = await admin.from("clientes").insert({ empresa_id: empresa!.id, nombre_negocio: nombre }).select("id").single();
  if (error) throw error;
  const { data: op } = await admin
    .from("oportunidades")
    .insert({ empresa_id: empresa!.id, cliente_id: cli.id, producto_id: nef!.id, etapa: "ganada" })
    .select("id")
    .single();
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const { error: e3 } = await admin.from("cobros").insert({
    empresa_id: empresa!.id,
    cliente_id: cli.id,
    oportunidad_id: op!.id,
    concepto: "instalacion",
    descripcion: "Instalación",
    valor,
    vence: hoy,
  });
  if (e3) throw e3;
}

/** Borra las rutas de la empresa de pruebas (cada prueba del mapa arma la suya). */
export async function borrarRutasPrueba() {
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: empresa } = await admin.from("empresas").select("id").eq("slug", "pruebas-e2e").single();
  await admin.from("rutas").delete().eq("empresa_id", empresa!.id);
}
