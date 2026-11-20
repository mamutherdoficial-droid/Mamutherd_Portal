// Rutas que se abren sin sesión. Todo lo demás es de la app y pide entrar.
export const RUTAS_PUBLICAS = ["/entrar", "/unirme"] as const;

export function esRutaPublica(ruta: string): boolean {
  return RUTAS_PUBLICAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));
}

/** Evita redirecciones a otros sitios: solo rutas internas que empiezan con una sola "/". */
export function rutaSegura(ruta: string | null | undefined, porDefecto = "/hoy"): string {
  if (!ruta || !ruta.startsWith("/") || ruta.startsWith("//") || ruta.startsWith("/\\")) return porDefecto;
  return ruta;
}
