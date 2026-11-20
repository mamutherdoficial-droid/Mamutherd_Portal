"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ETAPAS_ABIERTAS } from "@/lib/dominio/etapas";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

function refrescar(clienteId?: string) {
  revalidatePath("/ventas");
  revalidatePath("/hoy");
  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
}

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullish();

/** "Pasar a …": solo entre etapas abiertas. Ganada se marca con el pago (Fase 2, D-010). */
export async function cambiarEtapa(oportunidadId: string, etapa: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const leido = z
    .object({ id: z.uuid(), etapa: z.enum(ETAPAS_ABIERTAS) })
    .safeParse({ id: oportunidadId, etapa });
  if (!leido.success) return fallo("Esa etapa no se puede elegir aquí.");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .update({ etapa: leido.data.etapa })
    .eq("id", leido.data.id)
    .eq("empresa_id", ctx.empresa.id)
    .select("cliente_id")
    .maybeSingle();
  if (error) return fallo(errorAmable("cambiarEtapa", error));
  if (!data) return fallo("Solo quien lleva esta venta (o un gerente) puede moverla.");
  refrescar(data.cliente_id);
  return { ok: true, mensaje: "Venta movida" };
}

/** Marcar perdida exige motivo (también lo exige la base). */
export async function marcarPerdida(oportunidadId: string, motivo: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const leido = z
    .object({
      id: z.uuid(),
      motivo: z.string().trim().min(3, "Escribe por qué se perdió (sirve para mejorar el guion).").max(500),
    })
    .safeParse({ id: oportunidadId, motivo });
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Escribe el motivo.");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .update({ etapa: "perdida", motivo_perdida: leido.data.motivo, proxima_accion: null, proxima_fecha: null })
    .eq("id", leido.data.id)
    .eq("empresa_id", ctx.empresa.id)
    .select("cliente_id")
    .maybeSingle();
  if (error) return fallo(errorAmable("marcarPerdida", error));
  if (!data) return fallo("Solo quien lleva esta venta (o un gerente) puede cerrarla.");
  refrescar(data.cliente_id);
  return { ok: true, mensaje: "Marcada como perdida" };
}

/** Cambiar la próxima acción y fecha de una venta. */
export async function programarSeguimiento(
  oportunidadId: string,
  accion: string | null,
  proximaFecha: string | null,
): Promise<Resultado> {
  const ctx = await exigirContexto();
  const leido = z
    .object({ id: z.uuid(), accion: z.string().trim().max(200).nullish(), fecha })
    .safeParse({ id: oportunidadId, accion, fecha: proximaFecha });
  if (!leido.success) return fallo("Revisa la fecha.");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .update({ proxima_accion: leido.data.accion || null, proxima_fecha: leido.data.fecha ?? null })
    .eq("id", leido.data.id)
    .eq("empresa_id", ctx.empresa.id)
    .select("cliente_id")
    .maybeSingle();
  if (error) return fallo(errorAmable("programarSeguimiento", error));
  if (!data) return fallo("Solo quien lleva esta venta (o un gerente) puede cambiarla.");
  refrescar(data.cliente_id);
  return { ok: true, mensaje: "Seguimiento guardado" };
}

const vendedor = z.object({
  oportunidadId: z.uuid(),
  miembroId: z.uuid({ error: "Elige quién vendió." }),
  atribucion: z.enum(["propia", "conjunta", "referido"], { error: "Elige cómo se dio la venta." }),
  parte: z.union([z.literal(1), z.literal(0.5)]),
});

/** Gerente: quién comisiona por esta venta y en qué proporción (D-004). */
export async function asignarVendedor(datos: z.input<typeof vendedor>): Promise<Resultado> {
  const ctx = await exigirContexto();
  if (ctx.rol !== "gerente") return fallo("Solo un gerente asigna vendedores.");
  const leido = vendedor.safeParse(datos);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const d = leido.data;

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("oportunidad_vendedores").upsert(
    {
      oportunidad_id: d.oportunidadId,
      miembro_id: d.miembroId,
      empresa_id: ctx.empresa.id,
      atribucion: d.atribucion,
      parte: d.parte,
    },
    { onConflict: "oportunidad_id,miembro_id" },
  );
  if (error) return fallo(errorAmable("asignarVendedor", error));
  revalidatePath("/ventas");
  revalidatePath("/clientes", "layout");
  return { ok: true, mensaje: "Vendedor guardado" };
}

/**
 * Gerente: quitar un vendedor mal asignado. Solo si esa venta aún no generó comisiones
 * para esa persona (las comisiones dependen de esta fila; D-030).
 */
export async function quitarVendedor(oportunidadId: string, miembroId: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  if (ctx.rol !== "gerente") return fallo("Solo un gerente quita vendedores.");
  const leido = z.object({ o: z.uuid(), m: z.uuid() }).safeParse({ o: oportunidadId, m: miembroId });
  if (!leido.success) return fallo("Datos no válidos.");

  const supabase = await crearClienteServidor();
  const { count, error: e1 } = await supabase
    .from("comisiones")
    .select("id", { count: "exact", head: true })
    .eq("oportunidad_id", leido.data.o)
    .eq("miembro_id", leido.data.m);
  if (e1) return fallo(errorAmable("quitarVendedor", e1));
  if ((count ?? 0) > 0) return fallo("Esta persona ya tiene comisiones por esta venta; no se puede quitar.");

  const { error } = await supabase
    .from("oportunidad_vendedores")
    .delete()
    .eq("oportunidad_id", leido.data.o)
    .eq("miembro_id", leido.data.m)
    .eq("empresa_id", ctx.empresa.id);
  if (error) return fallo(errorAmable("quitarVendedor", error));
  revalidatePath("/ventas");
  revalidatePath("/clientes", "layout");
  return { ok: true, mensaje: "Vendedor quitado" };
}
