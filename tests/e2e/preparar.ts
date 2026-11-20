import { createClient } from "@supabase/supabase-js";

/**
 * Crea el usuario de prueba de Playwright y lo vuelve gerente de una empresa aparte
 * ("pruebas-e2e"), para no tocar los datos de Mamut. Nunca va en seed.sql (D-016).
 *
 * Necesita, en .env.test.local o en el CI:
 *   E2E_CORREO, E2E_CLAVE                  → usuario de prueba
 *   SUPABASE_SERVICE_ROLE_KEY              → solo aquí, nunca en la app (SEGURIDAD.md)
 * Si faltan, las pruebas con sesión se saltan y las demás corren igual.
 */
export default async function preparar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const correo = process.env.E2E_CORREO;
  const clave = process.env.E2E_CLAVE;
  if (!url || !servicio || !correo || !clave) {
    console.log("[preparar] Sin usuario de prueba: se saltan las pruebas con sesión.");
    return;
  }

  const admin = createClient(url, servicio, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. Usuario (si ya existe, se le pone la clave de nuevo)
  let usuarioId: string | undefined;
  const creado = await admin.auth.admin.createUser({ email: correo, password: clave, email_confirm: true });
  if (creado.data.user) {
    usuarioId = creado.data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    usuarioId = data.users.find((u) => u.email === correo)?.id;
    if (!usuarioId) throw creado.error ?? new Error("No se pudo crear el usuario de prueba");
    await admin.auth.admin.updateUserById(usuarioId, { password: clave });
  }

  // 2. Empresa de pruebas
  const { data: empresa, error: e1 } = await admin
    .from("empresas")
    .upsert({ nombre: "Pruebas e2e", slug: "pruebas-e2e" }, { onConflict: "slug" })
    .select("id")
    .single();
  if (e1) throw e1;

  // 3. Gerente de esa empresa
  const { data: existe } = await admin
    .from("miembros")
    .select("id")
    .eq("empresa_id", empresa.id)
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  if (!existe) {
    const { error: e2 } = await admin.from("miembros").insert({
      empresa_id: empresa.id,
      usuario_id: usuarioId,
      nombre: "Prueba Automática",
      rol: "gerente",
      forma_pago: "ninguno",
    });
    if (e2) throw e2;
  }
  console.log("[preparar] Usuario de prueba listo.");
}
