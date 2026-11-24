"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { leerLugares } from "@/lib/dominio/lugares";
import { normalizar } from "@/lib/dominio/extractos/leer";
import { leerEnlaceMaps, type Punto } from "@/lib/dominio/ruta";
import { diaBogota } from "@/lib/dominio/semanas";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

// Mapa y ruta del día (Fase 1b, D-044 a D-048). Todo pasa por RLS. Nunca se guarda dónde está la persona (D-046).

const punto = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

function refrescar() {
  revalidatePath("/ruta", "layout");
  revalidatePath("/hoy");
  revalidatePath("/ventas");
  revalidatePath("/clientes", "layout");
}

// ---------- Ubicar un negocio ----------

/**
 * Guarda dónde está un negocio. No pisa una ubicación ya guardada salvo `sobrescribir`.
 * Devuelve ok también si no cambió nada (con un mensaje que lo dice).
 */
export async function ubicarCliente(
  clienteId: string,
  p: Punto,
  fuente: "gps" | "mapa" | "enlace",
  sobrescribir = false,
): Promise<Resultado<{ cambio: boolean }>> {
  const ctx = await exigirContexto();
  if (!z.uuid().safeParse(clienteId).success || !punto.safeParse(p).success) return fallo("Esa ubicación no es válida.");
  const supabase = await crearClienteServidor();
  let q = supabase
    .from("clientes")
    .update({ lat: p.lat, lng: p.lng, ubicacion_fuente: fuente, ubicado_en: new Date().toISOString() })
    .eq("id", clienteId)
    .eq("empresa_id", ctx.empresa.id);
  if (!sobrescribir) q = q.is("lat", null);
  const { data, error } = await q.select("id");
  if (error) return fallo(errorAmable("ubicarCliente", error));
  const cambio = (data?.length ?? 0) > 0;
  if (cambio) refrescar();
  return { ok: true, datos: { cambio }, mensaje: cambio ? "Negocio ubicado" : "Ya tenía ubicación" };
}

const HOSTS_PERMITIDOS = new Set(["maps.app.goo.gl", "goo.gl", "maps.google.com", "www.google.com", "google.com"]);

/** Sigue un enlace corto de Google Maps (solo dominios de Google, máximo 3 saltos) y lee sus coordenadas. */
async function resolverEnlace(texto: string): Promise<Punto | null> {
  const directo = leerEnlaceMaps(texto);
  if (directo) return directo;
  let url: URL;
  try {
    url = new URL(texto.trim());
  } catch {
    return null;
  }
  for (let salto = 0; salto < 3; salto++) {
    if (url.protocol !== "https:" || !HOSTS_PERMITIDOS.has(url.hostname)) return null;
    let r: Response;
    try {
      r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    } catch {
      return null;
    }
    const destino = r.headers.get("location");
    if (!destino) return leerEnlaceMaps(url.toString());
    url = new URL(destino, url);
    const p = leerEnlaceMaps(url.toString());
    if (p) return p;
  }
  return null;
}

export async function ubicarConEnlace(clienteId: string, enlace: string): Promise<Resultado<{ cambio: boolean }>> {
  if (enlace.length > 2000) return fallo("Ese enlace es muy largo.");
  const p = await resolverEnlace(enlace);
  if (!p) return fallo("No encontramos la ubicación en ese enlace. Abre el lugar en Google Maps, toca Compartir y copia el enlace.");
  return ubicarCliente(clienteId, p, "enlace", true);
}

// ---------- La ruta ----------

async function rutaDeHoy(crear: boolean, nombre = "Ruta de hoy") {
  const ctx = await exigirContexto();
  const supabase = await crearClienteServidor();
  const hoy = diaBogota();
  const { data } = await supabase
    .from("rutas")
    .select("id")
    .eq("empresa_id", ctx.empresa.id)
    .eq("miembro_id", ctx.miembroId)
    .eq("fecha", hoy)
    .is("borrado_en", null)
    .order("creada_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data || !crear) return { ctx, supabase, rutaId: data?.id ?? null };
  const { data: nueva, error } = await supabase
    .from("rutas")
    .insert({ empresa_id: ctx.empresa.id, miembro_id: ctx.miembroId, fecha: hoy, nombre })
    .select("id")
    .single();
  if (error) throw new Error(errorAmable("rutaDeHoy", error));
  return { ctx, supabase, rutaId: nueva.id };
}

/** Pone el negocio al final de la ruta (sin repetir). Invalida la línea calculada. */
async function agregarA(supabase: Awaited<ReturnType<typeof crearClienteServidor>>, empresaId: string, rutaId: string, clienteId: string) {
  const { data: ya } = await supabase.from("ruta_paradas").select("id, orden").eq("ruta_id", rutaId);
  const { data: existe } = await supabase.from("ruta_paradas").select("id").eq("ruta_id", rutaId).eq("cliente_id", clienteId).maybeSingle();
  if (existe) return false;
  const orden = Math.max(0, ...(ya ?? []).map((p) => p.orden)) + 1;
  const { error } = await supabase.from("ruta_paradas").insert({ empresa_id: empresaId, ruta_id: rutaId, cliente_id: clienteId, orden });
  if (error) throw new Error(errorAmable("agregarParada", error));
  await supabase.from("rutas").update({ geometria: null, distancia_m: null, duracion_s: null }).eq("id", rutaId);
  return true;
}

export async function crearRuta(nombre: string): Promise<Resultado> {
  const n = z.string().trim().min(2, "Ponle un nombre a la ruta (la zona, por ejemplo).").max(80).safeParse(nombre);
  if (!n.success) return fallo(n.error.issues[0]?.message ?? "Revisa el nombre.");
  try {
    const { supabase, rutaId } = await rutaDeHoy(true, n.data);
    await supabase.from("rutas").update({ nombre: n.data }).eq("id", rutaId!);
  } catch (e) {
    return fallo(e instanceof Error ? e.message : "No pudimos crear la ruta.");
  }
  refrescar();
  return { ok: true, mensaje: "Ruta lista. Agrega los negocios." };
}

export async function agregarParada(clienteId: string): Promise<Resultado> {
  if (!z.uuid().safeParse(clienteId).success) return fallo("No encontramos ese negocio.");
  try {
    const { ctx, supabase, rutaId } = await rutaDeHoy(true);
    const nueva = await agregarA(supabase, ctx.empresa.id, rutaId!, clienteId);
    refrescar();
    return { ok: true, mensaje: nueva ? "Agregado a tu ruta de hoy" : "Ya estaba en tu ruta de hoy" };
  } catch (e) {
    return fallo(e instanceof Error ? e.message : "No pudimos agregarlo.");
  }
}

export async function saltarParada(paradaId: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  if (!z.uuid().safeParse(paradaId).success) return fallo("No encontramos esa parada.");
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("ruta_paradas")
    .update({ estado: "saltada" })
    .eq("id", paradaId)
    .eq("empresa_id", ctx.empresa.id)
    .eq("estado", "pendiente");
  if (error) return fallo(errorAmable("saltarParada", error));
  refrescar();
  return { ok: true, mensaje: "Saltada" };
}

/** Quitar de la ruta (es planeación, no historia): solo si sigue pendiente. */
export async function quitarParada(paradaId: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  if (!z.uuid().safeParse(paradaId).success) return fallo("No encontramos esa parada.");
  const supabase = await crearClienteServidor();
  const { data: p } = await supabase.from("ruta_paradas").select("ruta_id").eq("id", paradaId).maybeSingle();
  const { error } = await supabase.from("ruta_paradas").delete().eq("id", paradaId).eq("empresa_id", ctx.empresa.id).eq("estado", "pendiente");
  if (error) return fallo(errorAmable("quitarParada", error));
  if (p) await supabase.from("rutas").update({ geometria: null, distancia_m: null, duracion_s: null }).eq("id", p.ruta_id);
  refrescar();
  return { ok: true, mensaje: "Quitada de la ruta" };
}

export async function reordenarRuta(rutaId: string, paradas: string[]): Promise<Resultado> {
  await exigirContexto();
  if (!z.uuid().safeParse(rutaId).success || !z.array(z.uuid()).max(100).safeParse(paradas).success) return fallo("Ese orden no es válido.");
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("reordenar_ruta", { p_ruta: rutaId, p_paradas: paradas });
  if (error) return fallo(errorAmable("reordenarRuta", error));
  await supabase.from("rutas").update({ geometria: null, distancia_m: null, duracion_s: null }).eq("id", rutaId);
  refrescar();
  return { ok: true };
}

const PERFIL_ORS = { a_pie: "foot-walking", bici: "cycling-regular", carro: "driving-car" } as const;

/**
 * Línea por las calles con openrouteservice (D-045). Una llamada por cambio de orden o de paradas;
 * el resultado se guarda en rutas.geometria. Sin llave o si falla: { aproximada: true }.
 */
export async function calcularRuta(rutaId: string): Promise<Resultado<{ aproximada: boolean }>> {
  const ctx = await exigirContexto();
  if (!z.uuid().safeParse(rutaId).success) return fallo("No encontramos esa ruta.");
  const supabase = await crearClienteServidor();
  const { data: ruta } = await supabase.from("rutas").select("id, modo, geometria").eq("id", rutaId).eq("empresa_id", ctx.empresa.id).maybeSingle();
  if (!ruta) return fallo("No encontramos esa ruta.");
  if (ruta.geometria) return { ok: true, datos: { aproximada: false } };

  const { data: paradas } = await supabase
    .from("v_ruta_paradas")
    .select("lat, lng, estado")
    .eq("ruta_id", rutaId)
    .neq("estado", "saltada")
    .order("orden");
  const coords = (paradas ?? []).filter((p) => p.lat != null && p.lng != null).map((p) => [p.lng!, p.lat!]);
  const llave = process.env.ORS_API_KEY;
  if (coords.length < 2 || !llave) return { ok: true, datos: { aproximada: true } };

  try {
    const r = await fetch(`https://api.openrouteservice.org/v2/directions/${PERFIL_ORS[ruta.modo as keyof typeof PERFIL_ORS] ?? "foot-walking"}/geojson`, {
      method: "POST",
      headers: { Authorization: llave, "Content-Type": "application/json", Accept: "application/geo+json" },
      body: JSON.stringify({ coordinates: coords.slice(0, 50) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error("[calcularRuta] openrouteservice respondió", r.status);
      return { ok: true, datos: { aproximada: true } };
    }
    const geo = (await r.json()) as { features?: { geometry: unknown; properties?: { summary?: { distance?: number; duration?: number } } }[] };
    const f = geo.features?.[0];
    if (!f) return { ok: true, datos: { aproximada: true } };
    await supabase
      .from("rutas")
      .update({
        geometria: f.geometry as never,
        distancia_m: Math.round(f.properties?.summary?.distance ?? 0),
        duracion_s: Math.round(f.properties?.summary?.duration ?? 0),
      })
      .eq("id", rutaId);
    revalidatePath("/ruta", "layout");
    return { ok: true, datos: { aproximada: false } };
  } catch (e) {
    console.error("[calcularRuta]", e);
    return { ok: true, datos: { aproximada: true } };
  }
}

// ---------- Pegar lugares (D-048) ----------

export async function pegarLugares(texto: string): Promise<Resultado<{ agregados: number; nuevos: number; sinUbicar: number }>> {
  if (texto.length > 20_000) return fallo("La lista es muy larga. Pega máximo 30 lugares.");
  const { lugares } = leerLugares(texto);
  if (lugares.length === 0) return fallo("Escribe un lugar por línea, por ejemplo: Café Luna | enlace de Google Maps");

  try {
    const { ctx, supabase, rutaId } = await rutaDeHoy(true);
    const { data: visibles } = await supabase
      .from("clientes")
      .select("id, nombre_negocio, lat")
      .eq("empresa_id", ctx.empresa.id)
      .is("borrado_en", null)
      .limit(5000);
    const porNombre = new Map((visibles ?? []).map((c) => [normalizar(c.nombre_negocio), c]));
    let agregados = 0;
    let nuevos = 0;
    let sinUbicar = 0;

    for (const l of lugares) {
      let cliente = porNombre.get(normalizar(l.nombre));
      if (!cliente) {
        const { data, error } = await supabase
          .from("clientes")
          .insert({ empresa_id: ctx.empresa.id, nombre_negocio: l.nombre, direccion: l.direccion, creado_por: ctx.miembroId, origen: "otro" })
          .select("id, nombre_negocio, lat")
          .single();
        if (error) {
          console.error("[pegarLugares/crear]", error.message);
          continue;
        }
        cliente = data;
        porNombre.set(normalizar(l.nombre), data);
        nuevos++;
      }
      // Ubicación: punto directo o enlace corto resuelto. Nunca pisa una ubicación guardada.
      const p = l.punto ?? (l.enlaceCorto ? await resolverEnlace(l.enlaceCorto) : null);
      if (p && cliente.lat == null) {
        await supabase
          .from("clientes")
          .update({ lat: p.lat, lng: p.lng, ubicacion_fuente: "enlace", ubicado_en: new Date().toISOString() })
          .eq("id", cliente.id)
          .is("lat", null);
        cliente.lat = p.lat;
      }
      if (cliente.lat == null) sinUbicar++;
      if (await agregarA(supabase, ctx.empresa.id, rutaId!, cliente.id)) agregados++;
    }
    refrescar();
    const partes = [`${agregados} ${agregados === 1 ? "lugar agregado" : "lugares agregados"}`];
    if (nuevos) partes.push(`${nuevos} ${nuevos === 1 ? "negocio nuevo" : "negocios nuevos"}`);
    if (sinUbicar) partes.push(`${sinUbicar} sin ubicar`);
    return { ok: true, datos: { agregados, nuevos, sinUbicar }, mensaje: partes.join(" · ") };
  } catch (e) {
    return fallo(e instanceof Error ? e.message : "No pudimos agregar los lugares.");
  }
}
