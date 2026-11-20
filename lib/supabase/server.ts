import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./tipos";
import { entornoSupabase } from "./entorno";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Usa la sesión del usuario (cookies), así que toda consulta pasa por RLS.
 */
export async function crearClienteServidor() {
  const { url, llave } = entornoSupabase();
  const almacen = await cookies();

  return createServerClient<Database>(url, llave, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(lista) {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // En un Server Component no se pueden escribir cookies; el proxy ya renueva la sesión.
        }
      },
    },
  });
}
