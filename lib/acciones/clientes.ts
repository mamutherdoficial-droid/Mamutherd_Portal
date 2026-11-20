"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizarWhatsapp } from "@/lib/dominio/whatsapp";
import { exigirContexto } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { errorAmable, fallo, type Resultado } from "./resultado";

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => s || null)
    .nullish();

const esquema = z.object({
  id: z.uuid(),
  nombre_negocio: z.string().trim().min(2, "El nombre del negocio es muy corto.").max(160),
  tipo_negocio: opcional(80),
  direccion: opcional(200),
  barrio: opcional(80),
  contacto_nombre: opcional(120),
  contacto_whatsapp: opcional(30),
  instagram: opcional(80),
  origen: z.enum(["visita", "conocido", "referido", "instagram", "otro"]),
  notas: opcional(2000),
});

export type DatosCliente = z.input<typeof esquema>;

/** Editar los datos de un negocio (RLS: gerente, o la ayudante que lo creó). */
export async function editarCliente(datos: DatosCliente): Promise<Resultado> {
  const ctx = await exigirContexto();
  const leido = esquema.safeParse(datos);
  if (!leido.success) return fallo(leido.error.issues[0]?.message ?? "Revisa los datos.");
  const { id, ...campos } = leido.data;

  let whatsapp: string | null = null;
  if (campos.contacto_whatsapp) {
    whatsapp = normalizarWhatsapp(campos.contacto_whatsapp);
    if (!whatsapp) return fallo("Ese WhatsApp no parece un celular. Escríbelo así: 320 487 1882.");
  }
  if (campos.instagram) campos.instagram = campos.instagram.replace(/^@/, "");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .update({ ...campos, contacto_whatsapp: whatsapp })
    .eq("id", id)
    .eq("empresa_id", ctx.empresa.id)
    .select("id")
    .maybeSingle();
  if (error) return fallo(errorAmable("editarCliente", error));
  if (!data) return fallo("Solo quien creó este negocio (o un gerente) puede editarlo.");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
  revalidatePath("/ventas");
  return { ok: true, mensaje: "Datos guardados" };
}
