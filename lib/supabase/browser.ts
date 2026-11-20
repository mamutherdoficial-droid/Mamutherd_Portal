"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./tipos";
import { entornoSupabase } from "./entorno";

/** Cliente de Supabase para el navegador (solo llave pública + sesión del usuario). */
export function crearClienteNavegador() {
  const { url, llave } = entornoSupabase();
  return createBrowserClient<Database>(url, llave);
}
