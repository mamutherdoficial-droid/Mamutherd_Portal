"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

/** Guarda que este usuario terminó (o saltó) un recorrido del tutorial. */
export async function marcarRecorrido(recorrido: string, version: number, saltado: boolean): Promise<Resultado> {
  const ctx = await exigirContexto();
  const leido = z
    .object({ recorrido: z.string().regex(/^[a-z0-9-]{2,60}$/), version: z.int().positive(), saltado: z.boolean() })
    .safeParse({ recorrido, version, saltado });
  if (!leido.success) return fallo("Recorrido no válido.");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("recorridos_vistos").upsert(
    {
      usuario_id: ctx.usuarioId,
      empresa_id: ctx.empresa.id,
      recorrido: leido.data.recorrido,
      version: leido.data.version,
      saltado: leido.data.saltado,
      completado_en: new Date().toISOString(),
    },
    { onConflict: "usuario_id,empresa_id,recorrido" },
  );
  if (error) return fallo(errorAmable("marcarRecorrido", error));
  return { ok: true };
}

/** "Hacer el recorrido otra vez" (desde /guia): olvida lo visto para que vuelva a salir. */
export async function reiniciarRecorridos(): Promise<Resultado> {
  const ctx = await exigirContexto();
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("recorridos_vistos")
    .delete()
    .eq("usuario_id", ctx.usuarioId)
    .eq("empresa_id", ctx.empresa.id);
  if (error) return fallo(errorAmable("reiniciarRecorridos", error));
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Listo: el recorrido vuelve a empezar" };
}
