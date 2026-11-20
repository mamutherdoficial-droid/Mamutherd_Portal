import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Rol = "gerente" | "ayudante";

export type Contexto = {
  usuarioId: string;
  correo: string | null;
  miembroId: string;
  nombre: string;
  rol: Rol;
  empresa: { id: string; nombre: string; slug: string };
};

/**
 * Quién está usando la app y en qué empresa (una vez por petición).
 * Empresa activa: si pertenece a una sola, esa; el selector llega en la fase 5.
 * Devuelve null si el usuario aún no está vinculado a ninguna empresa.
 */
export const obtenerContexto = cache(async (): Promise<Contexto | null> => {
  const supabase = await crearClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  const usuarioId = auth?.claims?.sub;
  if (!usuarioId) redirect("/entrar");

  // RLS: cada quien ve solo los miembros de sus empresas.
  const { data, error } = await supabase
    .from("miembros")
    .select("id, nombre, rol, empresa:empresas!inner(id, nombre, slug, borrado_en)")
    .eq("usuario_id", usuarioId)
    .eq("activo", true)
    .is("borrado_en", null)
    .is("empresa.borrado_en", null)
    .order("creado_en", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[obtenerContexto]", error.code, error.message);
    throw new Error("No pudimos cargar tu empresa.");
  }

  const fila = data?.[0];
  if (!fila || !fila.empresa) return null;

  return {
    usuarioId,
    correo: typeof auth.claims.email === "string" ? auth.claims.email : null,
    miembroId: fila.id,
    nombre: fila.nombre,
    rol: fila.rol,
    empresa: { id: fila.empresa.id, nombre: fila.empresa.nombre, slug: fila.empresa.slug },
  };
});

/** Para páginas que exigen empresa: si no hay, manda a /hoy (que explica qué hacer). */
export async function exigirContexto(): Promise<Contexto> {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/hoy");
  return ctx;
}
