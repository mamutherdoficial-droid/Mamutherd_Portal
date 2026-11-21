import { createClient } from "@supabase/supabase-js";
import { HOTSPOTS, RECORRIDOS } from "../../lib/recorridos";
import { correoAyudante, correoInvitada } from "./ayuda";

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

  // 1. Usuarios: el gerente y una ayudante (si ya existen, se les pone la clave de nuevo)
  async function usuario(email: string): Promise<string> {
    const creado = await admin.auth.admin.createUser({ email, password: clave, email_confirm: true });
    if (creado.data.user) return creado.data.user.id;
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    const id = data.users.find((u) => u.email === email)?.id;
    if (!id) throw creado.error ?? new Error("No se pudo crear el usuario de prueba");
    await admin.auth.admin.updateUserById(id, { password: clave });
    return id;
  }
  const usuarioId = await usuario(correo);
  const ayudanteUsuarioId = await usuario(correoAyudante(correo));
  const invitadaUsuarioId = await usuario(correoInvitada(correo));

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

  // 3b. Ayudante de esa empresa (Fase 2: comisiones)
  const { data: yaAyudante } = await admin
    .from("miembros")
    .select("id")
    .eq("empresa_id", empresa.id)
    .eq("usuario_id", ayudanteUsuarioId)
    .maybeSingle();
  if (!yaAyudante) {
    const { error } = await admin.from("miembros").insert({
      empresa_id: empresa.id,
      usuario_id: ayudanteUsuarioId,
      nombre: "Ana E2E",
      rol: "ayudante",
      forma_pago: "comision",
    });
    if (error) throw error;
  }

  // 3c. La cuenta "invitada" empieza sin empresa (la prueba de invitaciones la vincula cada vez).
  //     Se desvincula (no se borra): los miembros son datos y quedan como historial de pruebas.
  const { error: ei } = await admin.from("miembros").update({ usuario_id: null }).eq("usuario_id", invitadaUsuarioId);
  if (ei) throw ei;
  await admin.from("recorridos_vistos").delete().eq("usuario_id", invitadaUsuarioId);

  // 4. Productos de la empresa de pruebas (para "Anotar visita").
  const { error: e3 } = await admin.from("productos").upsert(
    [
      { empresa_id: empresa.id, nombre: "Nef", orden: 1 },
      { empresa_id: empresa.id, nombre: "Antesala", orden: 2 },
    ],
    { onConflict: "empresa_id,nombre" },
  );
  if (e3) throw e3;

  // 4b. Planes y reglas de comisión (Fase 2), como los de Mamut.
  const { data: nef } = await admin.from("productos").select("id").eq("empresa_id", empresa.id).eq("nombre", "Nef").single();
  const { error: ep } = await admin.from("planes").upsert(
    [
      { empresa_id: empresa.id, producto_id: nef!.id, nombre: "Instalación", tipo: "unico", precio: 200000 },
      { empresa_id: empresa.id, producto_id: nef!.id, nombre: "Plan Básico", tipo: "mensual", precio: 35000 },
    ],
    { onConflict: "producto_id,nombre" },
  );
  if (ep) throw ep;
  const { error: er } = await admin.from("reglas_comision").upsert(
    [
      { empresa_id: empresa.id, atribucion: "propia", concepto: "instalacion", porcentaje: 25 },
      { empresa_id: empresa.id, atribucion: "propia", concepto: "mensualidad", porcentaje: 10, meses_max: 6 },
    ],
    { onConflict: "empresa_id,atribucion,concepto" },
  );
  if (er) throw er;

  // 4c. Inventario (Fase 4): los mismos ítems que Mamut, sin movimientos de corridas anteriores.
  const { error: ein } = await admin.from("inventario_items").upsert(
    [
      { empresa_id: empresa.id, nombre: "Sticker NFC NTAG213", costo_unitario: 1000, stock_minimo: 20 },
      { empresa_id: empresa.id, nombre: "Soporte acrílico de mesa", stock_minimo: 6 },
      { empresa_id: empresa.id, nombre: "Placa de caja", stock_minimo: 1 },
    ],
    { onConflict: "empresa_id,nombre" },
  );
  if (ein) throw ein;
  const { error: emv } = await admin.from("inventario_movimientos").delete().eq("empresa_id", empresa.id);
  if (emv) throw emv;

  // 5. Empezar limpio: borra los negocios de corridas anteriores (solo de "pruebas-e2e").
  const { error: e4 } = await admin.from("clientes").delete().eq("empresa_id", empresa.id);
  if (e4) throw e4;

  // 6. Tutorial ya visto, para que no tape las pruebas (la de la guía lo reinicia a propósito).
  const vistos = [usuarioId, ayudanteUsuarioId].flatMap((u) => [...RECORRIDOS, ...HOTSPOTS].map((r) => ({
    usuario_id: u,
    empresa_id: empresa.id,
    recorrido: r.id,
    version: r.version,
    saltado: true,
  })));
  const { error: e5 } = await admin.from("recorridos_vistos").upsert(vistos, {
    onConflict: "usuario_id,empresa_id,recorrido",
  });
  if (e5) throw e5;

  console.log("[preparar] Usuario de prueba listo.");
}
