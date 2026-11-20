import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { entornoSupabase } from "@/lib/supabase/entorno";
import { esRutaPublica } from "@/lib/rutas";

/**
 * Corre antes de cada página: renueva la sesión de Supabase y manda a /entrar
 * a quien abra una ruta de la app sin sesión. La seguridad real está en RLS;
 * esto solo evita mostrar pantallas vacías.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const { url, llave } = entornoSupabase();

  const supabase = createServerClient(url, llave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista) {
        for (const { name, value } of lista) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
      },
    },
  });

  // getClaims valida el JWT; no confiar en getSession() en el servidor.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);
  const ruta = request.nextUrl.pathname;

  if (!conSesion && !esRutaPublica(ruta)) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = ruta === "/" ? "" : `?siguiente=${encodeURIComponent(ruta + request.nextUrl.search)}`;
    return copiarCookies(respuesta, NextResponse.redirect(destino));
  }

  if (conSesion && ruta === "/entrar") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/hoy";
    destino.search = "";
    return copiarCookies(respuesta, NextResponse.redirect(destino));
  }

  return respuesta;
}

function copiarCookies(desde: NextResponse, hacia: NextResponse) {
  for (const c of desde.cookies.getAll()) hacia.cookies.set(c);
  return hacia;
}

export const config = {
  // Todo menos archivos estáticos, imágenes, íconos y el manifest de la PWA.
  matcher: [
    "/((?!_next/static|_next/image|marca/|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|woff2?|txt)$).*)",
  ],
};
