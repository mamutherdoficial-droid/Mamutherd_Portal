import "server-only";
import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoCobro } from "@/lib/dominio/cobros";

// Lecturas de la Fase 2. Todas pasan por RLS: una ayudante no recibe cobros, pagos ni suscripciones.

export type Plan = { id: string; producto_id: string; nombre: string; tipo: "unico" | "mensual"; precio: number | null };

export const planesActivos = cache(async (empresaId: string): Promise<Plan[]> => {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("planes")
    .select("id, producto_id, nombre, tipo, precio")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .is("borrado_en", null)
    .order("precio", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`planes: ${error.message}`);
  return (data ?? []) as Plan[];
});

export type PagoFila = { id: string; valor: number; fecha: string; medio: string; referencia: string | null };

export type CobroFila = {
  id: string;
  concepto: string;
  descripcion: string | null;
  valor: number;
  pagado: number;
  saldo: number;
  vence: string;
  periodo: string | null;
  estado: EstadoCobro;
  cliente: { id: string; nombre: string; contacto: string | null; whatsapp: string | null };
  pagos: PagoFila[];
};

/** Cobros de la empresa (sin anulados), con su cliente y sus pagos vigentes. Solo gerente. */
export async function cobrosLista(empresaId: string, clienteId?: string): Promise<CobroFila[]> {
  const supabase = await crearClienteServidor();
  let q = supabase
    .from("v_cobros")
    .select("id, cliente_id, concepto, descripcion, valor, pagado, saldo, vence, periodo, estado")
    .eq("empresa_id", empresaId)
    .is("anulado_en", null)
    .order("vence")
    .limit(1000);
  if (clienteId) q = q.eq("cliente_id", clienteId);
  const { data: cobros, error } = await q;
  if (error) throw new Error(`cobros: ${error.message}`);
  const lista = cobros ?? [];
  if (lista.length === 0) return [];

  const ids = lista.map((c) => c.id!);
  const clientesIds = [...new Set(lista.map((c) => c.cliente_id!))];
  const [clientes, pagos] = await Promise.all([
    supabase.from("clientes").select("id, nombre_negocio, contacto_nombre, contacto_whatsapp").in("id", clientesIds),
    supabase
      .from("pagos")
      .select("id, cobro_id, valor, fecha, medio, referencia")
      .in("cobro_id", ids)
      .is("anulado_en", null)
      .order("fecha"),
  ]);
  if (clientes.error) throw new Error(`clientes de cobros: ${clientes.error.message}`);
  if (pagos.error) throw new Error(`pagos: ${pagos.error.message}`);
  const porCliente = new Map((clientes.data ?? []).map((c) => [c.id, c]));

  return lista.map((c) => {
    const cl = porCliente.get(c.cliente_id!);
    return {
      id: c.id!,
      concepto: c.concepto!,
      descripcion: c.descripcion,
      valor: c.valor!,
      pagado: c.pagado ?? 0,
      saldo: c.saldo ?? 0,
      vence: c.vence!,
      periodo: c.periodo,
      estado: c.estado as EstadoCobro,
      cliente: {
        id: c.cliente_id!,
        nombre: cl?.nombre_negocio ?? "—",
        contacto: cl?.contacto_nombre ?? null,
        whatsapp: cl?.contacto_whatsapp ?? null,
      },
      pagos: (pagos.data ?? [])
        .filter((p) => p.cobro_id === c.id)
        .map((p) => ({ id: p.id, valor: p.valor, fecha: p.fecha, medio: p.medio, referencia: p.referencia })),
    };
  });
}

/** ¿Ya hay mensualidades creadas para ese mes? */
export async function hayMensualidades(empresaId: string, mes: string): Promise<boolean> {
  const supabase = await crearClienteServidor();
  const { count, error } = await supabase
    .from("cobros")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .eq("concepto", "mensualidad")
    .eq("periodo", mes)
    .is("anulado_en", null);
  if (error) throw new Error(`mensualidades: ${error.message}`);
  return (count ?? 0) > 0;
}

// ---------- Comisiones y equipo ----------

export type ComisionFila = {
  id: string;
  valor: number;
  estado: "pendiente" | "pagada" | "anulada";
  creado_en: string;
  pagada_en: string | null;
  medio_pago: string | null;
  concepto: string;
  atribucion: string;
  negocio: string;
};

type ComisionCruda = {
  id: string;
  valor: number;
  estado: ComisionFila["estado"];
  creado_en: string;
  pagada_en: string | null;
  medio_pago: string | null;
  regla: { concepto: string; atribucion: string } | null;
  oportunidad: { cliente: { nombre_negocio: string } | null } | null;
};

/** Comisiones de una persona (la ayudante ve solo las suyas por RLS). Sin la base del pago (D-037). */
export async function comisionesDe(empresaId: string, miembroId: string): Promise<ComisionFila[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("comisiones")
    .select(
      `id, valor, estado, creado_en, pagada_en, medio_pago,
       regla:reglas_comision(concepto, atribucion),
       oportunidad:oportunidades(cliente:clientes(nombre_negocio))`,
    )
    .eq("empresa_id", empresaId)
    .eq("miembro_id", miembroId)
    .neq("estado", "anulada")
    .order("creado_en", { ascending: false })
    .limit(500);
  if (error) throw new Error(`comisiones: ${error.message}`);
  return ((data ?? []) as unknown as ComisionCruda[]).map((k) => ({
    id: k.id,
    valor: k.valor,
    estado: k.estado,
    creado_en: k.creado_en,
    pagada_en: k.pagada_en,
    medio_pago: k.medio_pago,
    concepto: k.regla?.concepto ?? "otro",
    atribucion: k.regla?.atribucion ?? "",
    negocio: k.oportunidad?.cliente?.nombre_negocio ?? "Un negocio",
  }));
}

export type TrabajoFila = { id: string; titulo: string; valor: number; hecha_en: string | null };

/** Trabajos hechos sin pagar de una persona (v_por_pagar_ayudantes, origen trabajo). */
export async function trabajosPorPagar(empresaId: string, miembroId: string): Promise<TrabajoFila[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("tareas")
    .select("id, titulo, valor_trabajo, hecha_en")
    .eq("empresa_id", empresaId)
    .eq("asignada_a", miembroId)
    .eq("estado", "hecha")
    .not("valor_trabajo", "is", null)
    .is("trabajo_pagado_en", null)
    .is("borrado_en", null)
    .order("hecha_en");
  if (error) throw new Error(`trabajos: ${error.message}`);
  return (data ?? []).map((t) => ({ id: t.id, titulo: t.titulo, valor: t.valor_trabajo ?? 0, hecha_en: t.hecha_en }));
}

export type AlertaComision = { id: string; valor: number; negocio: string; pago_fecha: string; miembro_id: string };

/** Comisiones ya pagadas cuyo pago se anuló y que el gerente aún no ha descontado. */
export async function alertasComisiones(empresaId: string, miembroId?: string): Promise<AlertaComision[]> {
  const supabase = await crearClienteServidor();
  let q = supabase
    .from("comisiones")
    .select("id, valor, miembro_id, pago:pagos!inner(fecha, anulado_en), oportunidad:oportunidades(cliente:clientes(nombre_negocio))")
    .eq("empresa_id", empresaId)
    .eq("estado", "pagada")
    .is("ajustada_en", null)
    .not("pago.anulado_en", "is", null);
  if (miembroId) q = q.eq("miembro_id", miembroId);
  const { data, error } = await q;
  if (error) throw new Error(`alertas de comisiones: ${error.message}`);
  type Cruda = {
    id: string;
    valor: number;
    miembro_id: string;
    pago: { fecha: string } | null;
    oportunidad: { cliente: { nombre_negocio: string } | null } | null;
  };
  return ((data ?? []) as unknown as Cruda[]).map((k) => ({
    id: k.id,
    valor: k.valor,
    miembro_id: k.miembro_id,
    pago_fecha: k.pago?.fecha ?? "",
    negocio: k.oportunidad?.cliente?.nombre_negocio ?? "Un negocio",
  }));
}

export type PersonaEquipo = {
  id: string;
  nombre: string;
  rol: string;
  forma_pago: string;
  porPagar: number;
  alertas: number;
};

/** /equipo: cada persona con lo que se le debe (comisiones pendientes + trabajos) y sus alertas. */
export async function equipo(empresaId: string): Promise<PersonaEquipo[]> {
  const supabase = await crearClienteServidor();
  const [miembros, porPagar, alertas] = await Promise.all([
    supabase
      .from("miembros")
      .select("id, nombre, rol, forma_pago")
      .eq("empresa_id", empresaId)
      .eq("activo", true)
      .is("borrado_en", null)
      .order("nombre"),
    supabase.from("v_por_pagar_ayudantes").select("miembro_id, valor").eq("empresa_id", empresaId),
    alertasComisiones(empresaId),
  ]);
  if (miembros.error) throw new Error(`equipo: ${miembros.error.message}`);
  if (porPagar.error) throw new Error(`por pagar: ${porPagar.error.message}`);
  return (miembros.data ?? []).map((m) => ({
    ...m,
    porPagar: (porPagar.data ?? []).filter((p) => p.miembro_id === m.id).reduce((s, p) => s + (p.valor ?? 0), 0),
    alertas: alertas.filter((a) => a.miembro_id === m.id).length,
  }));
}

export async function miembroPorId(empresaId: string, miembroId: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("miembros")
    .select("id, nombre, rol, forma_pago")
    .eq("empresa_id", empresaId)
    .eq("id", miembroId)
    .is("borrado_en", null)
    .maybeSingle();
  if (error) throw new Error(`miembro: ${error.message}`);
  return data;
}
