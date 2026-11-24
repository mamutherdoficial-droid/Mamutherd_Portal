"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

const esquema = z
  .object({
    clienteId: z.uuid().nullish(),
    nombreNegocio: z.string().trim().max(160).nullish(),
    productoId: z.uuid({ error: "Elige el producto." }),
    habloConDueno: z.boolean(),
    resultado: z.enum(["interesado", "pidio_propuesta", "volver", "no_interesa"], { error: "Elige cómo te fue." }),
    proximaAccion: z.string().trim().max(200).nullish(),
    proximaFecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullish(),
    nota: z.string().trim().max(1000).nullish(),
  })
  .refine((d) => d.clienteId || (d.nombreNegocio && d.nombreNegocio.length >= 2), {
    error: "Escribe el nombre del negocio.",
    path: ["nombreNegocio"],
  });

export type DatosVisita = z.input<typeof esquema>;
export type VisitaGuardada = { clienteId: string; oportunidadId: string; clienteNuevo: boolean; etapa: string };

/** Anota una visita: crea o reutiliza el cliente y la oportunidad y registra la actividad (anotar_visita). */
export async function anotarVisita(datos: DatosVisita): Promise<Resultado<VisitaGuardada>> {
  const ctx = await exigirContexto();
  const leido = esquema.safeParse(datos);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const d = leido.data;

  const supabase = await crearClienteServidor();
  // empresa_id sale de la sesión, nunca del formulario (SEGURIDAD.md).
  const { data, error } = await supabase.rpc("anotar_visita", {
    p_empresa: ctx.empresa.id,
    p_producto_id: d.productoId,
    p_cliente_id: d.clienteId ?? undefined,
    p_nombre_negocio: d.clienteId ? undefined : (d.nombreNegocio ?? undefined),
    p_hablo_con_dueno: d.habloConDueno,
    p_resultado: d.resultado,
    p_proxima_accion: d.proximaAccion ?? undefined,
    p_proxima_fecha: d.proximaFecha ?? undefined,
    p_nota: d.nota ?? undefined,
  });
  if (error) return fallo(errorAmable("anotarVisita", error));

  const r = data as { cliente_id: string; oportunidad_id: string; cliente_nuevo: boolean; etapa: string };
  revalidatePath("/hoy");
  revalidatePath("/ventas");
  revalidatePath("/clientes", "layout");
  revalidatePath("/ruta", "layout"); // la base marca sola la parada de hoy como visitada
  return {
    ok: true,
    mensaje: "Visita anotada",
    datos: {
      clienteId: r.cliente_id,
      oportunidadId: r.oportunidad_id,
      clienteNuevo: r.cliente_nuevo,
      etapa: r.etapa,
    },
  };
}
