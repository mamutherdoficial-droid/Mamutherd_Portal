import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

// Lecturas de la Fase 4: inventario, metas, resumen de la semana y lo que suma Hoy.

export type Item = {
  id: string;
  nombre: string;
  unidad: string;
  costo_unitario: number | null;
  stock_minimo: number;
  stock: number;
  bajo: boolean;
};

export async function inventario(empresaId: string): Promise<Item[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("v_inventario")
    .select("id, nombre, unidad, costo_unitario, stock_minimo, stock, bajo")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(`inventario: ${error.message}`);
  return (data ?? []) as Item[];
}

export type Movimiento = {
  id: string;
  tipo: string;
  cantidad: number;
  costo_total: number | null;
  nota: string | null;
  fecha: string;
  item: string;
  cliente: string | null;
};

export async function movimientosRecientes(empresaId: string): Promise<Movimiento[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("inventario_movimientos")
    .select("id, tipo, cantidad, costo_total, nota, fecha, item:inventario_items(nombre), cliente:clientes(nombre_negocio)")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false })
    .limit(30);
  if (error) throw new Error(`movimientos: ${error.message}`);
  type Crudo = Omit<Movimiento, "item" | "cliente"> & { item: { nombre: string } | null; cliente: { nombre_negocio: string } | null };
  return ((data ?? []) as unknown as Crudo[]).map((m) => ({ ...m, item: m.item?.nombre ?? "—", cliente: m.cliente?.nombre_negocio ?? null }));
}

/** Clientes ganados recientes (para proponer la instalación). */
export async function ganadosRecientes(empresaId: string): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .select("cerrada_en, cliente:clientes!inner(id, nombre_negocio)")
    .eq("empresa_id", empresaId)
    .eq("etapa", "ganada")
    .is("borrado_en", null)
    .order("cerrada_en", { ascending: false })
    .limit(20);
  if (error) throw new Error(`ganados: ${error.message}`);
  const vistos = new Set<string>();
  const lista: { id: string; nombre: string }[] = [];
  for (const o of (data ?? []) as unknown as { cliente: { id: string; nombre_negocio: string } }[]) {
    if (vistos.has(o.cliente.id)) continue;
    vistos.add(o.cliente.id);
    lista.push({ id: o.cliente.id, nombre: o.cliente.nombre_negocio });
  }
  return lista;
}

export type MetaAvance = {
  id: string;
  semana: string;
  indicador: "visitas" | "conversaciones_dueno" | "clientes_nuevos" | "ingresos";
  objetivo: number;
  logrado: number;
  miembro_id: string | null;
  miembro: string | null;
  producto: string | null;
};

/** Metas con su avance desde un lunes (incluido) hasta otro (incluido). RLS: la ayudante ve las suyas y las de la empresa. */
export async function metasEntre(empresaId: string, desde: string, hasta: string): Promise<MetaAvance[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("v_avance_metas")
    .select("id, semana, indicador, objetivo, logrado, miembro_id, producto_id")
    .eq("empresa_id", empresaId)
    .gte("semana", desde)
    .lte("semana", hasta)
    .order("semana", { ascending: false });
  if (error) throw new Error(`metas: ${error.message}`);
  const filas = data ?? [];
  const miembrosIds = [...new Set(filas.map((m) => m.miembro_id).filter(Boolean))] as string[];
  const productosIds = [...new Set(filas.map((m) => m.producto_id).filter(Boolean))] as string[];
  const [mi, pr] = await Promise.all([
    miembrosIds.length ? supabase.from("miembros").select("id, nombre").in("id", miembrosIds) : Promise.resolve({ data: [] }),
    productosIds.length ? supabase.from("productos").select("id, nombre").in("id", productosIds) : Promise.resolve({ data: [] }),
  ]);
  const nombreMiembro = new Map((mi.data ?? []).map((x) => [x.id, x.nombre]));
  const nombreProducto = new Map((pr.data ?? []).map((x) => [x.id, x.nombre]));
  return filas.map((m) => ({
    id: m.id!,
    semana: m.semana!,
    indicador: m.indicador as MetaAvance["indicador"],
    objetivo: m.objetivo ?? 0,
    logrado: m.logrado ?? 0,
    miembro_id: m.miembro_id,
    miembro: m.miembro_id ? (nombreMiembro.get(m.miembro_id) ?? null) : null,
    producto: m.producto_id ? (nombreProducto.get(m.producto_id) ?? null) : null,
  }));
}

export type Resumen = {
  visitas: number;
  duenos: number;
  clientes_nuevos: number;
  ingresos: number;
  perdidas: number;
  objeciones: { motivo: string; veces: number }[];
  vencidos: { cantidad: number; saldo: number };
  por_pagar_equipo: number;
  stock_bajo: { nombre: string; stock: number; minimo: number }[];
  metas: { indicador: string; objetivo: number; logrado: number; miembro: string | null; producto: string | null }[];
};

export async function resumenSemana(empresaId: string, lunes: string): Promise<Resumen> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("resumen_semana", { p_empresa: empresaId, p_lunes: lunes });
  if (error) throw new Error(`resumen: ${error.message}`);
  return data as unknown as Resumen;
}

/** Números del tablero de Hoy para el gerente. */
export async function tableroGerente(empresaId: string) {
  const supabase = await crearClienteServidor();
  const [cobros, porPagar, stock] = await Promise.all([
    supabase.from("v_cobros").select("saldo, estado").eq("empresa_id", empresaId).in("estado", ["pendiente", "parcial", "vencido"]),
    supabase.from("v_por_pagar_ayudantes").select("valor").eq("empresa_id", empresaId),
    supabase.from("v_inventario").select("nombre, stock, stock_minimo").eq("empresa_id", empresaId).eq("activo", true).eq("bajo", true),
  ]);
  if (cobros.error) throw new Error(`tablero cobros: ${cobros.error.message}`);
  const lista = cobros.data ?? [];
  return {
    porCobrar: lista.reduce((s, c) => s + (c.saldo ?? 0), 0),
    vencido: lista.filter((c) => c.estado === "vencido").reduce((s, c) => s + (c.saldo ?? 0), 0),
    porPagarEquipo: (porPagar.data ?? []).reduce((s, p) => s + (p.valor ?? 0), 0),
    stockBajo: (stock.data ?? []).map((i) => ({ nombre: i.nombre!, stock: i.stock ?? 0, minimo: i.stock_minimo ?? 0 })),
  };
}
