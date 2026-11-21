"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formatearPesos } from "@/lib/dominio/dinero";
import { nombreMes } from "@/lib/dominio/cobros";
import { diaBogota } from "@/lib/dominio/semanas";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

// La app registra pagos; las comisiones las crea y anula la base (triggers). Nunca se insertan aquí.

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Revisa la fecha.");
const pesos = z.number().int("Solo pesos enteros.").positive("El valor debe ser mayor que cero.").max(1_000_000_000);
const medio = z.enum(["nequi", "bancolombia", "efectivo", "otro"]);

function refrescar(clienteId?: string) {
  revalidatePath("/cobros");
  revalidatePath("/ventas");
  revalidatePath("/hoy");
  revalidatePath("/equipo", "layout");
  revalidatePath("/mis-comisiones");
  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
}

async function soloGerente() {
  const ctx = await exigirContexto();
  return ctx.rol === "gerente" ? ctx : null;
}

// ---------- Asistente "Ganada" ----------

const esquemaGanar = z.object({
  oportunidadId: z.uuid(),
  planInstalacion: z.uuid("Elige el plan de instalación."),
  valor: pesos,
  vence: fecha,
  planMensual: z.uuid().nullish(),
  precioMensual: z.number().int().min(0).nullish(),
  diaCobro: z.number().int().min(1, "El día de cobro va del 1 al 28.").max(28, "El día de cobro va del 1 al 28."),
  inicia: fecha.nullish(),
  anticipo: z.number().int().min(0).nullish(),
  medio: medio.default("nequi"),
  fechaPago: fecha.nullish(),
});

export async function ganarVenta(entrada: z.input<typeof esquemaGanar>): Promise<Resultado<{ comisiones: number }>> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente puede marcar una venta como ganada.");
  const leido = esquemaGanar.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const d = leido.data;
  if (d.anticipo && d.anticipo > d.valor) return fallo("El anticipo no puede ser mayor que la instalación.");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("ganar_oportunidad", {
    p_oportunidad: d.oportunidadId,
    p_plan_instalacion: d.planInstalacion,
    p_valor: d.valor,
    p_vence: d.vence,
    p_plan_mensual: d.planMensual ?? undefined,
    p_precio_mensual: d.precioMensual ?? undefined,
    p_dia_cobro: d.diaCobro,
    p_inicia: d.inicia ?? undefined,
    p_anticipo: d.anticipo ?? undefined,
    p_medio: d.medio,
    p_fecha_pago: d.fechaPago ?? undefined,
  });
  if (error) return fallo(errorAmable("ganarVenta", error));
  const r = data as { comisiones?: number } | null;
  refrescar();
  const comisiones = Number(r?.comisiones ?? 0);
  return {
    ok: true,
    datos: { comisiones },
    mensaje: comisiones > 0 ? `¡Venta ganada! Comisiones creadas: ${formatearPesos(comisiones)}` : "¡Venta ganada!",
  };
}

// ---------- Pagos ----------

const esquemaPago = z.object({
  cobroId: z.uuid(),
  valor: pesos,
  fecha,
  medio,
  referencia: z.string().trim().max(120).nullish(),
});

export async function registrarPago(entrada: z.input<typeof esquemaPago>): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente registra pagos.");
  const leido = esquemaPago.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos del pago.");
  const d = leido.data;
  if (d.fecha > diaBogota()) return fallo("La fecha del pago no puede ser futura.");

  const supabase = await crearClienteServidor();
  const { data: cobro, error: e1 } = await supabase
    .from("v_cobros")
    .select("saldo, cliente_id, estado")
    .eq("id", d.cobroId)
    .eq("empresa_id", ctx.empresa.id)
    .maybeSingle();
  if (e1) return fallo(errorAmable("registrarPago/cobro", e1));
  if (!cobro || cobro.estado === "anulado") return fallo("No encontramos ese cobro.");
  if (d.valor > (cobro.saldo ?? 0)) return fallo(`El saldo es ${formatearPesos(cobro.saldo ?? 0)}. No se puede pagar más.`);

  const { error } = await supabase.from("pagos").insert({
    empresa_id: ctx.empresa.id,
    cobro_id: d.cobroId,
    valor: d.valor,
    fecha: d.fecha,
    medio: d.medio,
    referencia: d.referencia || null,
    registrado_por: ctx.miembroId,
  });
  if (error) return fallo(errorAmable("registrarPago", error));
  refrescar(cobro.cliente_id ?? undefined);
  return { ok: true, mensaje: `Pago de ${formatearPesos(d.valor)} registrado` };
}

/** Anula un pago (borrado lógico). Si alguna comisión de ese pago ya estaba pagada, lo avisa. */
export async function anularPago(pagoId: string): Promise<Resultado<{ alerta: boolean }>> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente anula pagos.");
  if (!z.uuid().safeParse(pagoId).success) return fallo("No encontramos ese pago.");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("pagos")
    .update({ anulado_en: new Date().toISOString() })
    .eq("id", pagoId)
    .eq("empresa_id", ctx.empresa.id)
    .is("anulado_en", null)
    .select("id, cobro:cobros(cliente_id)")
    .maybeSingle();
  if (error) return fallo(errorAmable("anularPago", error));
  if (!data) return fallo("Ese pago ya estaba anulado.");

  const { count } = await supabase
    .from("comisiones")
    .select("id", { count: "exact", head: true })
    .eq("pago_id", pagoId)
    .eq("estado", "pagada");
  const alerta = (count ?? 0) > 0;
  const cliente = (data.cobro as { cliente_id: string } | null)?.cliente_id;
  refrescar(cliente);
  return {
    ok: true,
    datos: { alerta },
    mensaje: alerta
      ? "Pago anulado. Ojo: ya habías pagado su comisión; descuéntala del próximo pago (lo ves en Equipo)."
      : "Pago anulado. Sus comisiones pendientes se anularon.",
  };
}

// ---------- Mensualidades ----------

export async function generarMensualidades(mes: string): Promise<Resultado<{ creadas: number }>> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente genera mensualidades.");
  if (!fecha.safeParse(mes).success) return fallo("Revisa el mes.");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("generar_mensualidades", { p_empresa: ctx.empresa.id, p_mes: mes });
  if (error) return fallo(errorAmable("generarMensualidades", error));
  const creadas = Number(data ?? 0);
  refrescar();
  if (creadas > 0) {
    return {
      ok: true,
      datos: { creadas },
      mensaje: `${creadas} ${creadas === 1 ? "mensualidad creada" : "mensualidades creadas"} para ${nombreMes(mes)}.`,
    };
  }
  // 0 creadas: o ya estaban, o no hay planes mensuales activos ese mes.
  const { count } = await supabase
    .from("cobros")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", ctx.empresa.id)
    .eq("concepto", "mensualidad")
    .eq("periodo", mes)
    .is("anulado_en", null);
  return {
    ok: true,
    datos: { creadas: 0 },
    mensaje: (count ?? 0) > 0
      ? `Ya estaban creadas las mensualidades de ${nombreMes(mes)}.`
      : `No hay planes mensuales activos para ${nombreMes(mes)}.`,
  };
}

// ---------- Pagar a ayudantes ----------

const esquemaPagarEquipo = z.object({
  miembroId: z.uuid(),
  comisiones: z.array(z.uuid()).max(500),
  trabajos: z.array(z.uuid()).max(500),
  fecha,
  medio,
});

export async function pagarAyudante(entrada: z.input<typeof esquemaPagarEquipo>): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente marca pagos al equipo.");
  const leido = esquemaPagarEquipo.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const d = leido.data;
  if (d.comisiones.length + d.trabajos.length === 0) return fallo("No hay nada por pagar.");

  const supabase = await crearClienteServidor();
  if (d.comisiones.length > 0) {
    const { error } = await supabase
      .from("comisiones")
      .update({ estado: "pagada", pagada_en: d.fecha, medio_pago: d.medio })
      .eq("empresa_id", ctx.empresa.id)
      .eq("miembro_id", d.miembroId)
      .eq("estado", "pendiente")
      .in("id", d.comisiones);
    if (error) return fallo(errorAmable("pagarAyudante/comisiones", error));
  }
  if (d.trabajos.length > 0) {
    const { error } = await supabase
      .from("tareas")
      .update({ trabajo_pagado_en: d.fecha })
      .eq("empresa_id", ctx.empresa.id)
      .eq("asignada_a", d.miembroId)
      .is("trabajo_pagado_en", null)
      .in("id", d.trabajos);
    if (error) return fallo(errorAmable("pagarAyudante/trabajos", error));
  }
  refrescar();
  return { ok: true, mensaje: "Marcado como pagado" };
}

/** "Ya lo descontó": cierra la alerta de una comisión pagada sobre un pago anulado. */
export async function marcarAjustada(comisionId: string): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente puede hacer esto.");
  if (!z.uuid().safeParse(comisionId).success) return fallo("No encontramos esa comisión.");
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("comisiones")
    .update({ ajustada_en: new Date().toISOString() })
    .eq("id", comisionId)
    .eq("empresa_id", ctx.empresa.id);
  if (error) return fallo(errorAmable("marcarAjustada", error));
  refrescar();
  return { ok: true, mensaje: "Listo, quedó descontada" };
}
