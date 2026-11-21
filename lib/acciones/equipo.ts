"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizarWhatsapp } from "@/lib/dominio/whatsapp";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

// Equipo, invitaciones y tareas (Fase 3). Sin service_role: todo pasa por RLS y funciones SQL.

async function soloGerente() {
  const ctx = await exigirContexto();
  return ctx.rol === "gerente" ? ctx : null;
}

function refrescar() {
  revalidatePath("/equipo", "layout");
  revalidatePath("/tareas");
  revalidatePath("/hoy");
}

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Revisa la fecha.");

// ---------- Personas ----------

const esquemaMiembro = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre (mínimo 2 letras).").max(120),
  whatsapp: z.string().trim().max(30).optional(),
  correo: z.union([z.literal(""), z.email("Ese correo no parece válido.")]).optional(),
  rol: z.enum(["gerente", "ayudante"]),
  forma_pago: z.enum(["fijo", "comision", "por_trabajo", "ninguno"]),
});

export async function crearMiembro(entrada: z.input<typeof esquemaMiembro>): Promise<Resultado<{ id: string }>> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente agrega personas al equipo.");
  const leido = esquemaMiembro.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const d = leido.data;
  const whatsapp = d.whatsapp ? normalizarWhatsapp(d.whatsapp) : null;
  if (d.whatsapp && !whatsapp) return fallo("Ese WhatsApp no parece un celular de Colombia (10 dígitos, empieza por 3).");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("miembros")
    .insert({
      empresa_id: ctx.empresa.id,
      nombre: d.nombre,
      whatsapp,
      correo: d.correo ? d.correo.toLowerCase() : null,
      rol: d.rol,
      forma_pago: d.forma_pago,
    })
    .select("id")
    .single();
  if (error) return fallo(errorAmable("crearMiembro", error));
  refrescar();
  return { ok: true, datos: { id: data.id }, mensaje: `${d.nombre} quedó en el equipo` };
}

// ---------- Invitaciones ----------

/** Crea la invitación y devuelve el enlace /unirme?token=… para mandarlo por WhatsApp. */
export async function invitar(miembroId: string): Promise<Resultado<{ enlace: string }>> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente puede invitar.");
  if (!z.uuid().safeParse(miembroId).success) return fallo("No encontramos a esa persona.");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("crear_invitacion", { p_miembro: miembroId });
  if (error) return fallo(errorAmable("invitar", error));

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  refrescar();
  return { ok: true, datos: { enlace: `${proto}://${host}/unirme?token=${data}` }, mensaje: "Invitación lista" };
}

/** La persona invitada (ya con sesión) acepta. No exige empresa: todavía no es miembro. */
export async function aceptarInvitacion(token: string): Promise<Resultado<{ empresa: string }>> {
  if (!/^[0-9a-f]{64}$/.test(token)) return fallo("Ese enlace de invitación no es válido.");
  const supabase = await crearClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return fallo("Primero crea tu cuenta o entra.");
  const { data, error } = await supabase.rpc("aceptar_invitacion", { p_token: token });
  if (error) return fallo(errorAmable("aceptarInvitacion", error));
  const r = data as { empresa?: string } | null;
  revalidatePath("/", "layout");
  return { ok: true, datos: { empresa: r?.empresa ?? "" }, mensaje: `¡Bienvenida a ${r?.empresa ?? "el equipo"}!` };
}

// ---------- Tareas ----------

const esquemaTarea = z.object({
  titulo: z.string().trim().min(3, "Escribe la tarea (mínimo 3 letras).").max(160),
  tipo: z.enum(["general", "seguimiento", "fotos", "instalacion", "diseno"]),
  asignadaA: z.uuid("Elige a quién se la asignas."),
  vence: fecha.nullish(),
  valorTrabajo: z.number().int("Solo pesos enteros.").min(0).max(100_000_000).nullish(),
  descripcion: z.string().trim().max(1000).nullish(),
});

export async function crearTarea(entrada: z.input<typeof esquemaTarea>): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente crea y asigna tareas.");
  const leido = esquemaTarea.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const d = leido.data;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("tareas").insert({
    empresa_id: ctx.empresa.id,
    titulo: d.titulo,
    tipo: d.tipo,
    asignada_a: d.asignadaA,
    vence: d.vence || null,
    valor_trabajo: d.valorTrabajo || null,
    descripcion: d.descripcion || null,
    creado_por: ctx.miembroId,
  });
  if (error) return fallo(errorAmable("crearTarea", error));
  refrescar();
  return { ok: true, mensaje: "Tarea asignada" };
}

/** Hecha / pendiente (cualquiera con la tarea); cancelada (solo gerente). No se borra (borrado lógico). */
export async function cambiarTarea(tareaId: string, estado: "hecha" | "pendiente" | "cancelada"): Promise<Resultado> {
  const ctx = await exigirContexto();
  if (!z.uuid().safeParse(tareaId).success) return fallo("No encontramos esa tarea.");
  if (estado === "cancelada" && ctx.rol !== "gerente") return fallo("Solo un gerente cancela tareas.");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("tareas")
    .update({ estado })
    .eq("id", tareaId)
    .eq("empresa_id", ctx.empresa.id)
    .select("id")
    .maybeSingle();
  if (error) return fallo(errorAmable("cambiarTarea", error));
  if (!data) return fallo("Esa tarea no es tuya.");
  refrescar();
  return { ok: true, mensaje: estado === "hecha" ? "¡Hecha!" : estado === "cancelada" ? "Tarea cancelada" : "Tarea reabierta" };
}
