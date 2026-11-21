import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

// Lecturas de la Fase 3 (equipo y tareas). Todas pasan por RLS: una ayudante solo ve sus tareas.

export type TareaFila = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  estado: "pendiente" | "hecha" | "cancelada";
  vence: string | null;
  valor_trabajo: number | null;
  trabajo_pagado_en: string | null;
  hecha_en: string | null;
  asignada: { id: string; nombre: string } | null;
};

/** Tareas abiertas y las hechas de los últimos 30 días (gerente: todas; ayudante: las suyas por RLS). */
export async function tareas(empresaId: string, miembroId?: string): Promise<TareaFila[]> {
  const supabase = await crearClienteServidor();
  const hace30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  let q = supabase
    .from("tareas")
    .select(
      "id, titulo, descripcion, tipo, estado, vence, valor_trabajo, trabajo_pagado_en, hecha_en, asignada:miembros!tareas_asignada_a_fkey(id, nombre)",
    )
    .eq("empresa_id", empresaId)
    .is("borrado_en", null)
    .or(`estado.eq.pendiente,hecha_en.gte.${hace30}`)
    .order("vence", { ascending: true, nullsFirst: false })
    .order("creado_en", { ascending: false })
    .limit(500);
  if (miembroId) q = q.eq("asignada_a", miembroId);
  const { data, error } = await q;
  if (error) throw new Error(`tareas: ${error.message}`);
  return (data ?? []) as unknown as TareaFila[];
}

export type Regla = { atribucion: string; concepto: string; porcentaje: number; meses_max: number | null };

/** Reglas de comisión activas (la "copia de los acuerdos"). */
export async function reglasComision(empresaId: string): Promise<Regla[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("reglas_comision")
    .select("atribucion, concepto, porcentaje, meses_max")
    .eq("empresa_id", empresaId)
    .eq("activa", true)
    .order("atribucion")
    .order("concepto");
  if (error) throw new Error(`reglas: ${error.message}`);
  return (data ?? []).map((r) => ({ ...r, porcentaje: Number(r.porcentaje) }));
}

export type Persona = {
  id: string;
  nombre: string;
  rol: string;
  forma_pago: string;
  whatsapp: string | null;
  correo: string | null;
  con_acceso: boolean;
  invitacion_viva: boolean;
};

export async function persona(empresaId: string, miembroId: string): Promise<Persona | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("miembros")
    .select("id, nombre, rol, forma_pago, whatsapp, correo, usuario_id")
    .eq("empresa_id", empresaId)
    .eq("id", miembroId)
    .is("borrado_en", null)
    .maybeSingle();
  if (error) throw new Error(`persona: ${error.message}`);
  if (!data) return null;
  const { count } = await supabase
    .from("invitaciones")
    .select("id", { count: "exact", head: true })
    .eq("miembro_id", miembroId)
    .is("usada_en", null)
    .gt("vence_en", new Date().toISOString());
  const { usuario_id, ...resto } = data;
  return { ...resto, con_acceso: Boolean(usuario_id), invitacion_viva: (count ?? 0) > 0 };
}

/** Quién tiene acceso al portal (para la lista de /equipo). */
export async function accesos(empresaId: string): Promise<Record<string, boolean>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("miembros")
    .select("id, usuario_id")
    .eq("empresa_id", empresaId)
    .is("borrado_en", null);
  if (error) throw new Error(`accesos: ${error.message}`);
  return Object.fromEntries((data ?? []).map((m) => [m.id, Boolean(m.usuario_id)]));
}
