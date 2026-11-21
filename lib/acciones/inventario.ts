"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { diaBogota } from "@/lib/dominio/semanas";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

// Inventario y metas (Fase 4). Solo gerente; la base lo exige también (RLS y guardar_meta).

async function soloGerente() {
  const ctx = await exigirContexto();
  return ctx.rol === "gerente" ? ctx : null;
}

function refrescar() {
  revalidatePath("/inventario");
  revalidatePath("/metas");
  revalidatePath("/semana");
  revalidatePath("/hoy");
}

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Revisa la fecha.");

const esquemaMovimiento = z.object({
  itemId: z.uuid(),
  tipo: z.enum(["compra", "dano", "ajuste"]),
  cantidad: z.number().int("Solo unidades enteras.").refine((n) => n !== 0, "La cantidad no puede ser cero."),
  costoTotal: z.number().int("Solo pesos enteros.").min(0).nullish(),
  nota: z.string().trim().max(300).nullish(),
  fecha: fecha.optional(),
});

/** Compra (+), daño (−) o ajuste (±). Las instalaciones van por registrarInstalacion. */
export async function registrarMovimiento(entrada: z.input<typeof esquemaMovimiento>): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente mueve el inventario.");
  const leido = esquemaMovimiento.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const d = leido.data;
  // La base exige el signo: compra positiva, daño negativo.
  const cantidad = d.tipo === "compra" ? Math.abs(d.cantidad) : d.tipo === "dano" ? -Math.abs(d.cantidad) : d.cantidad;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("inventario_movimientos").insert({
    empresa_id: ctx.empresa.id,
    item_id: d.itemId,
    tipo: d.tipo,
    cantidad,
    costo_total: d.tipo === "compra" ? (d.costoTotal ?? null) : null,
    nota: d.nota || null,
    fecha: d.fecha ?? diaBogota(),
    registrado_por: ctx.miembroId,
  });
  if (error) return fallo(errorAmable("registrarMovimiento", error));
  refrescar();
  const texto = d.tipo === "compra" ? "Compra registrada" : d.tipo === "dano" ? "Daño registrado" : "Ajuste registrado";
  return { ok: true, mensaje: texto };
}

const esquemaInstalacion = z.object({
  clienteId: z.uuid("Elige el cliente."),
  items: z
    .array(z.object({ itemId: z.uuid(), cantidad: z.number().int().min(0).max(1000) }))
    .max(20),
});

/** Instalación en un cliente: todos los movimientos en una sola inserción (todo o nada). */
export async function registrarInstalacion(entrada: z.input<typeof esquemaInstalacion>): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente registra instalaciones.");
  const leido = esquemaInstalacion.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const filas = leido.data.items
    .filter((i) => i.cantidad > 0)
    .map((i) => ({
      empresa_id: ctx.empresa.id,
      item_id: i.itemId,
      tipo: "instalacion" as const,
      cantidad: -i.cantidad,
      cliente_id: leido.data.clienteId,
      fecha: diaBogota(),
      registrado_por: ctx.miembroId,
    }));
  if (filas.length === 0) return fallo("Pon al menos una cantidad.");
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("inventario_movimientos").insert(filas);
  if (error) return fallo(errorAmable("registrarInstalacion", error));
  refrescar();
  return { ok: true, mensaje: "Instalación registrada: el stock ya bajó" };
}

const esquemaMetas = z.object({
  semana: fecha,
  miembroId: z.uuid().nullish(),
  metas: z
    .array(
      z.object({
        indicador: z.enum(["visitas", "conversaciones_dueno", "clientes_nuevos", "ingresos"]),
        objetivo: z.number().int("Solo números enteros.").min(0).max(1_000_000_000),
      }),
    )
    .min(1)
    .max(4),
});

/** Pone (o cambia) las metas de una semana, para la empresa o para una persona. */
export async function guardarMetas(entrada: z.input<typeof esquemaMetas>): Promise<Resultado> {
  const ctx = await soloGerente();
  if (!ctx) return fallo("Solo un gerente pone metas.");
  const leido = esquemaMetas.safeParse(entrada);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa las metas.");
  const d = leido.data;
  const supabase = await crearClienteServidor();
  for (const m of d.metas) {
    const { error } = await supabase.rpc("guardar_meta", {
      p_empresa: ctx.empresa.id,
      p_semana: d.semana,
      p_indicador: m.indicador,
      p_objetivo: m.objetivo,
      p_miembro: d.miembroId ?? undefined,
    });
    if (error) return fallo(errorAmable("guardarMetas", error));
  }
  refrescar();
  return { ok: true, mensaje: "Metas guardadas" };
}
