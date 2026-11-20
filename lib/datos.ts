import "server-only";
import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ETAPAS_ABIERTAS } from "@/lib/dominio/etapas";

// Lecturas de la Fase 1. Todas pasan por RLS: una ayudante solo recibe lo suyo.

export type Producto = { id: string; nombre: string };
export type ClienteCorto = { id: string; nombre: string; barrio: string | null };
export type Miembro = { id: string; nombre: string; rol: string };

export const productosActivos = cache(async (empresaId: string): Promise<Producto[]> => {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .is("borrado_en", null)
    .order("orden");
  if (error) throw new Error(`productos: ${error.message}`);
  return data ?? [];
});

export const clientesCortos = cache(async (empresaId: string): Promise<ClienteCorto[]> => {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre_negocio, barrio")
    .eq("empresa_id", empresaId)
    .is("borrado_en", null)
    .order("nombre_negocio")
    .limit(2000);
  if (error) throw new Error(`clientes: ${error.message}`);
  return (data ?? []).map((c) => ({ id: c.id, nombre: c.nombre_negocio, barrio: c.barrio }));
});

export const miembrosActivos = cache(async (empresaId: string): Promise<Miembro[]> => {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("miembros")
    .select("id, nombre, rol")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .is("borrado_en", null)
    .order("nombre");
  if (error) throw new Error(`miembros: ${error.message}`);
  return data ?? [];
});

export type OportunidadFila = {
  id: string;
  etapa: string;
  valor_estimado: number | null;
  proxima_accion: string | null;
  proxima_fecha: string | null;
  motivo_perdida: string | null;
  creado_en: string;
  cliente: { id: string; nombre: string; contacto: string | null; whatsapp: string | null };
  producto: { id: string; nombre: string };
  responsable: { id: string; nombre: string } | null;
  vendedores: { miembro_id: string; nombre: string; atribucion: string; parte: number }[];
};

const SELECT_OPORTUNIDAD = `
  id, etapa, valor_estimado, proxima_accion, proxima_fecha, motivo_perdida, creado_en,
  cliente:clientes!inner(id, nombre_negocio, contacto_nombre, contacto_whatsapp, borrado_en),
  producto:productos!inner(id, nombre),
  responsable:miembros!oportunidades_responsable_id_fkey(id, nombre),
  vendedores:oportunidad_vendedores(miembro_id, atribucion, parte, miembro:miembros(nombre))
`;

type FilaCruda = {
  id: string;
  etapa: string;
  valor_estimado: number | null;
  proxima_accion: string | null;
  proxima_fecha: string | null;
  motivo_perdida: string | null;
  creado_en: string;
  cliente: { id: string; nombre_negocio: string; contacto_nombre: string | null; contacto_whatsapp: string | null };
  producto: { id: string; nombre: string };
  responsable: { id: string; nombre: string } | null;
  vendedores: { miembro_id: string; atribucion: string; parte: number; miembro: { nombre: string } | null }[];
};

function aFila(o: FilaCruda): OportunidadFila {
  return {
    id: o.id,
    etapa: o.etapa,
    valor_estimado: o.valor_estimado,
    proxima_accion: o.proxima_accion,
    proxima_fecha: o.proxima_fecha,
    motivo_perdida: o.motivo_perdida,
    creado_en: o.creado_en,
    cliente: {
      id: o.cliente.id,
      nombre: o.cliente.nombre_negocio,
      contacto: o.cliente.contacto_nombre,
      whatsapp: o.cliente.contacto_whatsapp,
    },
    producto: o.producto,
    responsable: o.responsable,
    vendedores: (o.vendedores ?? []).map((v) => ({
      miembro_id: v.miembro_id,
      nombre: v.miembro?.nombre ?? "—",
      atribucion: v.atribucion,
      parte: Number(v.parte),
    })),
  };
}

/** Seguimientos para /hoy: oportunidades abiertas con próxima fecha hasta hoy (vencidas y de hoy). */
export async function seguimientosHasta(empresaId: string, hoy: string): Promise<OportunidadFila[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .select(SELECT_OPORTUNIDAD)
    .eq("empresa_id", empresaId)
    .is("borrado_en", null)
    .is("cliente.borrado_en", null)
    .in("etapa", [...ETAPAS_ABIERTAS])
    .lte("proxima_fecha", hoy)
    .order("proxima_fecha")
    .limit(200);
  if (error) throw new Error(`seguimientos: ${error.message}`);
  return ((data ?? []) as unknown as FilaCruda[]).map(aFila);
}

/** Todas las oportunidades (abiertas y cerradas recientes) para /ventas. */
export async function oportunidades(empresaId: string): Promise<OportunidadFila[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .select(SELECT_OPORTUNIDAD)
    .eq("empresa_id", empresaId)
    .is("borrado_en", null)
    .is("cliente.borrado_en", null)
    .order("proxima_fecha", { ascending: true, nullsFirst: false })
    .order("creado_en", { ascending: false })
    .limit(500);
  if (error) throw new Error(`oportunidades: ${error.message}`);
  return ((data ?? []) as unknown as FilaCruda[]).map(aFila);
}

/** Oportunidades de un cliente. */
export async function oportunidadesDeCliente(empresaId: string, clienteId: string): Promise<OportunidadFila[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .select(SELECT_OPORTUNIDAD)
    .eq("empresa_id", empresaId)
    .eq("cliente_id", clienteId)
    .is("borrado_en", null)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(`oportunidades del cliente: ${error.message}`);
  return ((data ?? []) as unknown as FilaCruda[]).map(aFila);
}

export type ClienteFicha = {
  id: string;
  nombre_negocio: string;
  tipo_negocio: string | null;
  direccion: string | null;
  barrio: string | null;
  contacto_nombre: string | null;
  contacto_whatsapp: string | null;
  instagram: string | null;
  origen: string;
  notas: string | null;
  creado_en: string;
  creado_por: string | null;
};

export async function clienteFicha(empresaId: string, clienteId: string): Promise<ClienteFicha | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select(
      "id, nombre_negocio, tipo_negocio, direccion, barrio, contacto_nombre, contacto_whatsapp, instagram, origen, notas, creado_en, creado_por",
    )
    .eq("empresa_id", empresaId)
    .eq("id", clienteId)
    .is("borrado_en", null)
    .maybeSingle();
  if (error) throw new Error(`cliente: ${error.message}`);
  return data;
}

export type Actividad = {
  id: string;
  tipo: string;
  resultado: string | null;
  hablo_con_dueno: boolean;
  fecha: string;
  miembro: string | null;
  producto: string | null;
};

export async function actividadesDeCliente(empresaId: string, clienteId: string): Promise<Actividad[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("actividades")
    .select("id, tipo, resultado, hablo_con_dueno, fecha, miembro:miembros(nombre), oportunidad:oportunidades(producto:productos(nombre))")
    .eq("empresa_id", empresaId)
    .eq("cliente_id", clienteId)
    .order("fecha", { ascending: false })
    .limit(100);
  if (error) throw new Error(`actividades: ${error.message}`);
  type Cruda = {
    id: string;
    tipo: string;
    resultado: string | null;
    hablo_con_dueno: boolean;
    fecha: string;
    miembro: { nombre: string } | null;
    oportunidad: { producto: { nombre: string } | null } | null;
  };
  return ((data ?? []) as unknown as Cruda[]).map((a) => ({
    id: a.id,
    tipo: a.tipo,
    resultado: a.resultado,
    hablo_con_dueno: a.hablo_con_dueno,
    fecha: a.fecha,
    miembro: a.miembro?.nombre ?? null,
    producto: a.oportunidad?.producto?.nombre ?? null,
  }));
}

/** Buscador de /clientes. */
export async function buscarClientes(empresaId: string, q: string) {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("clientes")
    .select("id, nombre_negocio, tipo_negocio, barrio, contacto_nombre, creado_en")
    .eq("empresa_id", empresaId)
    .is("borrado_en", null)
    .order("nombre_negocio")
    .limit(200);
  const limpio = q.trim().replace(/[%_,()]/g, " ").trim();
  if (limpio) {
    const p = `%${limpio}%`;
    consulta = consulta.or(`nombre_negocio.ilike.${p},barrio.ilike.${p},contacto_nombre.ilike.${p},tipo_negocio.ilike.${p}`);
  }
  const { data, error } = await consulta;
  if (error) throw new Error(`buscar clientes: ${error.message}`);
  return data ?? [];
}

/** Visitas anotadas desde un día (Bogotá, UTC-5 todo el año) hasta ahora. */
export async function visitasDesde(empresaId: string, dia: string): Promise<{ visitas: number; duenos: number }> {
  const supabase = await crearClienteServidor();
  const desde = `${dia}T05:00:00Z`;
  const [todas, conDueno] = await Promise.all([
    supabase
      .from("actividades")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("tipo", "visita")
      .gte("fecha", desde),
    supabase
      .from("actividades")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("tipo", "visita")
      .eq("hablo_con_dueno", true)
      .gte("fecha", desde),
  ]);
  if (todas.error) throw new Error(`visitas: ${todas.error.message}`);
  return { visitas: todas.count ?? 0, duenos: conDueno.count ?? 0 };
}

/** Recorridos del tutorial que este usuario ya vio (recorrido → versión). */
export async function recorridosVistos(empresaId: string): Promise<Record<string, number>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("recorridos_vistos")
    .select("recorrido, version")
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`recorridos: ${error.message}`);
  return Object.fromEntries((data ?? []).map((r) => [r.recorrido, r.version]));
}
