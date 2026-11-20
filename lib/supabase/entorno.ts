// Solo la URL y la llave pública (anon/publishable). La service_role nunca llega aquí (docs/SEGURIDAD.md).
// Se aceptan los dos nombres de la llave: Supabase ahora la llama "publishable key".
export function entornoSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !llave) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (en .env.local o en Vercel).",
    );
  }
  return { url, llave };
}
