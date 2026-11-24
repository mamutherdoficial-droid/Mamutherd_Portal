// "Pegar lugares" (D-048): una lista de texto → paradas de la ruta. Una línea por lugar:
//   Café Luna
//   Café Luna | https://maps.app.goo.gl/abc        (enlace de Google Maps, largo o corto)
//   Café Luna | 4.6336, -74.0660                    (coordenadas)
//   Café Luna | Cra 13 # 45-20                      (dirección: se guarda, queda "Sin ubicar")
// Separador: "|", tabulador o ";". Se ignoran viñetas ("-", "•", "1.") y líneas vacías.
// No se geocodifican direcciones (las de Bogotá se ubican mal con servicios gratis).
import { leerEnlaceMaps, type Punto } from "./ruta";

export type LugarPegado = {
  nombre: string;
  punto: Punto | null;
  /** Enlace corto de Maps (maps.app.goo.gl): se resuelve en el servidor. */
  enlaceCorto: string | null;
  direccion: string | null;
};

export const MAX_LUGARES = 30;
const CORTO = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i;

export function leerLugares(texto: string): { lugares: LugarPegado[]; ignoradas: number } {
  const lugares: LugarPegado[] = [];
  let ignoradas = 0;
  for (const cruda of texto.split(/\r?\n/)) {
    const linea = cruda.trim().replace(/^(?:[-•*]|\d{1,2}[.)])\s+/, "");
    if (!linea) continue;
    const [nombreCrudo, ...resto] = linea.split(/\s*[|\t;]\s*/);
    const nombre = (nombreCrudo ?? "").trim().slice(0, 120);
    const detalle = resto.join(" ").trim();
    if (nombre.length < 2) {
      ignoradas++;
      continue;
    }
    let punto: Punto | null = null;
    let enlaceCorto: string | null = null;
    let direccion: string | null = null;
    if (detalle) {
      if (CORTO.test(detalle)) enlaceCorto = detalle;
      else {
        punto = leerEnlaceMaps(detalle);
        if (!punto && !/^https?:\/\//i.test(detalle)) direccion = detalle.slice(0, 200);
      }
    }
    lugares.push({ nombre, punto, enlaceCorto, direccion });
    if (lugares.length >= MAX_LUGARES) break;
  }
  return { lugares, ignoradas };
}
