import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
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

/** Cookie con la empresa activa (selector de empresa, Fase 5). No es secreta: RLS decide qué se ve. */
export const COOKIE_EMPRESA = "empresa_activa";

/**
 * Quién está usando la app y en qué empresa (una vez por petición).
 * Empresa activa: la de la cookie si la persona pertenece a ella; si no, la primera.
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
    .limit(20);

  if (error) {
    console.error("[obtenerContexto]", error.code, error.message);
    throw new Error("No pudimos cargar tu empresa.");
  }

  const elegida = (await cookies()).get(COOKIE_EMPRESA)?.value;
  const fila = data?.find((m) => m.empresa?.id === elegida) ?? data?.[0];
  if (!fila || !fila.empresa) return null;
  // La base solo acepta 'gerente' o 'ayudante' (check); cualquier otra cosa se trata como ayudante.
  const rol: Rol = fila.rol === "gerente" ? "gerente" : "ayudante";

  return {
    usuarioId,
    correo: typeof auth.claims.email === "string" ? auth.claims.email : null,
    miembroId: fila.id,
    nombre: fila.nombre,
    rol,
    empresa: { id: fila.empresa.id, nombre: fila.empresa.nombre, slug: fila.empresa.slug },
  };
});

/** Para páginas que exigen empresa: si no hay, manda a /hoy (que explica qué hacer). */
export async function exigirContexto(): Promise<Contexto> {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/hoy");
  return ctx;
}

/** Empresas a las que pertenece la persona (para el selector). */
export const misEmpresas = cache(async (): Promise<{ id: string; nombre: string; rol: Rol }[]> => {
  const supabase = await crearClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  const usuarioId = auth?.claims?.sub;
  if (!usuarioId) return [];
  const { data } = await supabase
    .from("miembros")
    .select("rol, empresa:empresas!inner(id, nombre, borrado_en)")
    .eq("usuario_id", usuarioId)
    .eq("activo", true)
    .is("borrado_en", null)
    .is("empresa.borrado_en", null)
    .order("creado_en", { ascending: true })
    .limit(20);
  return (data ?? []).map((m) => ({ id: m.empresa.id, nombre: m.empresa.nombre, rol: m.rol === "gerente" ? "gerente" : "ayudante" }));
});
