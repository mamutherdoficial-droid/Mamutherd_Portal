import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

// Lecturas del mapa y la ruta del día (Fase 1b). Pasan por RLS: una ayudante solo ve sus rutas.

export type ParadaVista = {
  id: string;
  orden: number;
  estado: "pendiente" | "visitada" | "saltada";
  cliente_id: string;
  nombre: string;
  tipo: string | null;
  direccion: string | null;
  barrio: string | null;
  lat: number | null;
  lng: number | null;
  whatsapp: string | null;
  etapa: string | null;
  proxima_accion: string | null;
};

/** GeoJSON LineString de la ruta calculada (coordenadas [lng, lat]). */
export type LineaGeo = { type: "LineString"; coordinates: [number, number][] };

export type RutaVista = {
  id: string;
  nombre: string;
  fecha: string;
  modo: "a_pie" | "bici" | "carro";
  distancia_m: number | null;
  duracion_s: number | null;
  geometria: LineaGeo | null;
  paradas: ParadaVista[];
};

async function conParadas(ruta: Omit<RutaVista, "paradas">): Promise<RutaVista> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("v_ruta_paradas")
    .select("id, orden, estado, cliente_id, nombre_negocio, tipo_negocio, direccion, barrio, lat, lng, contacto_whatsapp, etapa, proxima_accion")
    .eq("ruta_id", ruta.id)
    .order("orden");
  if (error) throw new Error(`paradas: ${error.message}`);
  return {
    ...ruta,
    paradas: (data ?? []).map((p) => ({
      id: p.id!,
      orden: p.orden!,
      estado: p.estado as ParadaVista["estado"],
      cliente_id: p.cliente_id!,
      nombre: p.nombre_negocio!,
      tipo: p.tipo_negocio,
      direccion: p.direccion,
      barrio: p.barrio,
      lat: p.lat,
      lng: p.lng,
      whatsapp: p.contacto_whatsapp,
      etapa: p.etapa,
      proxima_accion: p.proxima_accion,
    })),
  };
}

const COLUMNAS_RUTA = "id, nombre, fecha, modo, distancia_m, duracion_s, geometria";

/** La ruta de un día de una persona (la más reciente si hubiera varias). */
export async function rutaDelDia(empresaId: string, miembroId: string, fecha: string): Promise<RutaVista | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("rutas")
    .select(COLUMNAS_RUTA)
    .eq("empresa_id", empresaId)
    .eq("miembro_id", miembroId)
    .eq("fecha", fecha)
    .is("borrado_en", null)
    .order("creada_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`ruta: ${error.message}`);
  return data ? conParadas(data as unknown as Omit<RutaVista, "paradas">) : null;
}

export async function rutaPorId(empresaId: string, rutaId: string): Promise<RutaVista | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("rutas")
    .select(COLUMNAS_RUTA)
    .eq("empresa_id", empresaId)
    .eq("id", rutaId)
    .is("borrado_en", null)
    .maybeSingle();
  if (error) throw new Error(`ruta: ${error.message}`);
  return data ? conParadas(data as unknown as Omit<RutaVista, "paradas">) : null;
}

export type NegocioUbicado = { id: string; nombre: string; lat: number; lng: number };

/** Negocios con ubicación (para el mapa de ventas). */
export async function negociosUbicados(empresaId: string): Promise<NegocioUbicado[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre_negocio, lat, lng")
    .eq("empresa_id", empresaId)
    .is("borrado_en", null)
    .not("lat", "is", null)
    .limit(2000);
  if (error) throw new Error(`ubicados: ${error.message}`);
  return (data ?? []).map((c) => ({ id: c.id, nombre: c.nombre_negocio, lat: c.lat!, lng: c.lng! }));
}
