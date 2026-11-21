"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { leerCsv } from "@/lib/dominio/extractos/leer";
import { aCsv, claveNegocio, leerClientes } from "@/lib/dominio/importar";
import { plantilla } from "@/lib/dominio/plantillas";
import { mostrarWhatsapp } from "@/lib/dominio/whatsapp";
import { COOKIE_EMPRESA, exigirContexto, misEmpresas } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

// Fase 5: crear empresa, cambiar de empresa, importar y exportar clientes.

/** ¿El registro público está abierto? Se prende en Vercel con REGISTRO_ABIERTO=si (D-042). */
async function registroAbierto(): Promise<boolean> {
  return process.env.REGISTRO_ABIERTO === "si";
}

const esquemaEmpresa = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre del negocio.").max(80),
  miNombre: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  plantilla: z.string().max(40),
});

/**
 * Crea la empresa (queda como gerente) y le pone la plantilla elegida.
 * Con el registro cerrado, solo puede hacerlo quien ya es gerente de otra empresa.
 */
export async function crearEmpresa(entrada: z.input<typeof esquemaEmpresa>): Promise<Resultado<{ empresaId: string }>> {
  const leido = esquemaEmpresa.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const supabase = await crearClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return fallo("Primero crea tu cuenta o entra.");
  const yaGerente = (await misEmpresas()).some((e) => e.rol === "gerente");
  if (!(await registroAbierto()) && !yaGerente) return fallo("El registro todavía no está abierto.");

  const { data: empresaId, error } = await supabase.rpc("crear_empresa", { p_nombre: leido.data.nombre, p_mi_nombre: leido.data.miNombre });
  if (error || !empresaId) return fallo(errorAmable("crearEmpresa", error));

  // Plantilla: productos, planes y reglas de ejemplo (ya es gerente: RLS lo deja).
  const p = plantilla(leido.data.plantilla);
  if (p) {
    for (const [orden, pr] of p.productos.entries()) {
      const { data: producto, error: e1 } = await supabase
        .from("productos")
        .insert({ empresa_id: empresaId, nombre: pr.nombre, orden: orden + 1 })
        .select("id")
        .single();
      if (e1) {
        console.error("[crearEmpresa/plantilla]", e1.message);
        continue;
      }
      if (pr.planes.length) {
        await supabase.from("planes").insert(pr.planes.map((pl) => ({ empresa_id: empresaId, producto_id: producto.id, ...pl })));
      }
    }
    if (p.reglas.length) {
      await supabase.from("reglas_comision").insert(p.reglas.map((r) => ({ empresa_id: empresaId, meses_max: null, ...r })));
    }
  }

  (await cookies()).set(COOKIE_EMPRESA, empresaId, { path: "/", sameSite: "lax", httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  return { ok: true, datos: { empresaId }, mensaje: `¡Listo! ${leido.data.nombre} quedó creada.` };
}

export async function cambiarEmpresa(empresaId: string): Promise<Resultado> {
  if (!z.uuid().safeParse(empresaId).success) return fallo("Esa empresa no existe.");
  const mias = await misEmpresas();
  if (!mias.some((e) => e.id === empresaId)) return fallo("No perteneces a esa empresa.");
  (await cookies()).set(COOKIE_EMPRESA, empresaId, { path: "/", sameSite: "lax", httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  return { ok: true, mensaje: `Ahora estás en ${mias.find((e) => e.id === empresaId)!.nombre}` };
}

// ---------- Importar y exportar clientes (solo gerente) ----------

export async function importarClientes(datos: FormData): Promise<Resultado<{ nuevos: number; repetidos: number; sinNombre: number }>> {
  const ctx = await exigirContexto();
  if (ctx.rol !== "gerente") return fallo("Solo un gerente importa clientes.");
  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return fallo("Elige el archivo .csv.");
  if (archivo.size > 2 * 1024 * 1024) return fallo("El archivo pesa más de 2 MB.");
  if (!archivo.name.toLowerCase().endsWith(".csv")) return fallo("Guarda la hoja como .csv (en Excel: Guardar como → CSV).");

  let lectura;
  try {
    lectura = leerClientes(leerCsv(new TextDecoder("utf-8").decode(await archivo.arrayBuffer())));
  } catch (e) {
    return fallo(e instanceof Error && e.message.startsWith("Falta") ? e.message : "No pudimos leer el archivo.");
  }
  if (lectura.clientes.length === 0) return fallo("El archivo no tiene clientes con nombre.");

  const supabase = await crearClienteServidor();
  const { data: existentes, error: e1 } = await supabase
    .from("clientes")
    .select("nombre_negocio")
    .eq("empresa_id", ctx.empresa.id)
    .is("borrado_en", null)
    .limit(10000);
  if (e1) return fallo(errorAmable("importarClientes/leer", e1));
  const ya = new Set((existentes ?? []).map((c) => claveNegocio(c.nombre_negocio)));
  const nuevos = [];
  for (const c of lectura.clientes) {
    const k = claveNegocio(c.nombre_negocio);
    if (ya.has(k)) continue;
    ya.add(k);
    nuevos.push({ ...c, empresa_id: ctx.empresa.id, creado_por: ctx.miembroId, origen: "otro" as const });
  }
  if (nuevos.length) {
    const { error } = await supabase.from("clientes").insert(nuevos);
    if (error) return fallo(errorAmable("importarClientes", error));
  }
  revalidatePath("/clientes");
  const repetidos = lectura.clientes.length - nuevos.length;
  return {
    ok: true,
    datos: { nuevos: nuevos.length, repetidos, sinNombre: lectura.sinNombre },
    mensaje:
      nuevos.length === 0
        ? "Esos clientes ya estaban. No se duplicó nada."
        : `${nuevos.length} ${nuevos.length === 1 ? "cliente importado" : "clientes importados"}${repetidos ? ` (${repetidos} ya estaban)` : ""}.`,
  };
}

/** Exporta los clientes en CSV. Solo gerente y queda registro (Ley 1581, SEGURIDAD.md). */
export async function exportarClientes(): Promise<Resultado<{ csv: string; archivo: string }>> {
  const ctx = await exigirContexto();
  if (ctx.rol !== "gerente") return fallo("Solo un gerente exporta clientes.");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("nombre_negocio, tipo_negocio, direccion, barrio, contacto_nombre, contacto_whatsapp, instagram, notas")
    .eq("empresa_id", ctx.empresa.id)
    .is("borrado_en", null)
    .order("nombre_negocio")
    .limit(10000);
  if (error) return fallo(errorAmable("exportarClientes", error));
  const filas = data ?? [];
  const { error: e2 } = await supabase
    .from("exportaciones")
    .insert({ empresa_id: ctx.empresa.id, miembro_id: ctx.miembroId, tipo: "clientes", filas: filas.length });
  if (e2) return fallo(errorAmable("exportarClientes/registro", e2));
  const csv = aCsv([
    ["Negocio", "Tipo", "Dirección", "Barrio", "Contacto", "WhatsApp", "Instagram", "Notas"],
    ...filas.map((c) => [c.nombre_negocio, c.tipo_negocio, c.direccion, c.barrio, c.contacto_nombre, mostrarWhatsapp(c.contacto_whatsapp), c.instagram, c.notas]),
  ]);
  return { ok: true, datos: { csv, archivo: `clientes-${ctx.empresa.slug}.csv` }, mensaje: `${filas.length} clientes exportados` };
}
