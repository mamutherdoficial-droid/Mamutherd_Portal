"use server";
import { revalidatePath } from "next/cache";
import readXlsxFile from "read-excel-file/node";
import { z } from "zod";
import { leerCsv, leerFilas, type Celda } from "@/lib/dominio/extractos/leer";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

// Conciliar con el banco (Fase 4b, D-017). El portal PROPONE; el gerente confirma.
// Nunca se crea un pago sin confirmación: solo confirmar_movimiento lo hace.

const MAX_BYTES = 2 * 1024 * 1024;

async function soloGerente() {
  const ctx = await exigirContexto();
  return ctx.rol === "gerente" ? ctx : null;
}

function refrescar() {
  revalidatePath("/cobros", "layout");
  revalidatePath("/hoy");
  revalidatePath("/equipo", "layout");
  revalidatePath("/mis-comisiones");
}

export async function subirExtracto(datos: FormData): Promise<Resultado<{ nuevos: number; repetidos: number }>> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente sube extractos.");
  const banco = z.enum(["bancolombia", "nequi", "otro"]).safeParse(datos.get("banco"));
  if (!banco.success) return fallo("Elige el banco.");
  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return fallo("Elige el archivo del extracto.");
  if (archivo.size > MAX_BYTES) return fallo("El archivo pesa más de 2 MB. Descarga solo el mes o la semana.");
  const nombre = archivo.name.toLowerCase();
  if (!nombre.endsWith(".csv") && !nombre.endsWith(".xlsx")) return fallo("Sube el extracto en .csv o .xlsx.");

  let lectura;
  try {
    const bytes = Buffer.from(await archivo.arrayBuffer());
    const filas: Celda[][] = nombre.endsWith(".xlsx")
      ? ((await readXlsxFile(bytes)) as Celda[][])
      : leerCsv(new TextDecoder("utf-8").decode(bytes));
    lectura = await leerFilas(filas, banco.data);
  } catch (e) {
    console.error("[subirExtracto]", e);
    const mensaje = e instanceof Error && e.message.startsWith("No encontramos") ? e.message : "No pudimos leer el archivo. ¿Es el extracto tal como lo descarga el banco?";
    return fallo(mensaje);
  }
  if (lectura.movimientos.length === 0) return fallo("El archivo no tiene ingresos para conciliar.");

  const supabase = await crearClienteServidor();
  const { data: extracto, error: e1 } = await supabase
    .from("extractos")
    .insert({
      empresa_id: ctx.empresa.id,
      banco: banco.data,
      archivo: archivo.name.slice(0, 200),
      filas: lectura.movimientos.length + lectura.salidas + lectura.descartadas,
      subido_por: ctx.miembroId,
    })
    .select("id")
    .single();
  if (e1) return fallo(errorAmable("subirExtracto/extracto", e1));

  // La huella es única por empresa: lo que ya estaba se ignora (no se duplica).
  const { data: insertados, error: e2 } = await supabase
    .from("movimientos_banco")
    .upsert(
      lectura.movimientos.map((m) => ({
        empresa_id: ctx.empresa.id,
        extracto_id: extracto.id,
        banco: banco.data,
        fecha: m.fecha,
        descripcion: m.descripcion,
        referencia: m.referencia,
        valor: m.valor,
        huella: m.huella,
      })),
      { onConflict: "empresa_id,huella", ignoreDuplicates: true },
    )
    .select("id");
  if (e2) return fallo(errorAmable("subirExtracto/movimientos", e2));
  const nuevos = insertados?.length ?? 0;
  const repetidos = lectura.movimientos.length - nuevos;
  await supabase.from("extractos").update({ nuevos }).eq("id", extracto.id);
  refrescar();

  if (nuevos === 0) return { ok: true, datos: { nuevos, repetidos }, mensaje: "Esos movimientos ya estaban. No se duplicó nada." };
  return {
    ok: true,
    datos: { nuevos, repetidos },
    mensaje: `${nuevos} ${nuevos === 1 ? "ingreso nuevo" : "ingresos nuevos"} para revisar${repetidos > 0 ? ` (${repetidos} ya estaban)` : ""}.`,
  };
}

export async function confirmarMovimiento(movimientoId: string, cobroId: string): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente confirma pagos.");
  if (!z.uuid().safeParse(movimientoId).success || !z.uuid().safeParse(cobroId).success) return fallo("Elige el cobro.");
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("confirmar_movimiento", { p_movimiento: movimientoId, p_cobro: cobroId });
  if (error) return fallo(errorAmable("confirmarMovimiento", error));
  refrescar();
  return { ok: true, mensaje: "Pago registrado. Las comisiones se crearon solas." };
}

export async function descartarMovimiento(movimientoId: string): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente revisa el extracto.");
  if (!z.uuid().safeParse(movimientoId).success) return fallo("No encontramos ese movimiento.");
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("movimientos_banco")
    .update({ estado: "descartado", revisado_por: ctx.miembroId, revisado_en: new Date().toISOString() })
    .eq("id", movimientoId)
    .eq("empresa_id", ctx.empresa.id)
    .eq("estado", "propuesto");
  if (error) return fallo(errorAmable("descartarMovimiento", error));
  refrescar();
  return { ok: true, mensaje: "Ignorado" };
}
