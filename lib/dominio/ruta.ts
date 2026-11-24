// Reglas puras de la ruta del día (fase 1b). Sin red ni React: se prueban con Vitest.
// Ver docs/DESIGN.md (Ruta) y docs/DECISIONES.md (D-044 a D-047).

export type Punto = { lat: number; lng: number };
export type Parada = Punto & { id: string };
export type Modo = 'a_pie' | 'bici' | 'carro';

const RADIO_TIERRA_M = 6_371_000;
const rad = (g: number) => (g * Math.PI) / 180;

/** Distancia en línea recta, en metros (fórmula del haversine). */
export function distanciaM(a: Punto, b: Punto): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Largo de un recorrido abierto (sin volver al inicio), en metros. */
export function largoRecorridoM(puntos: Punto[], inicio?: Punto | null): number {
  const todos = inicio ? [inicio, ...puntos] : puntos;
  let total = 0;
  for (let i = 1; i < todos.length; i++) total += distanciaM(todos[i - 1]!, todos[i]!);
  return total;
}

/**
 * Ordena las paradas para caminar lo menos posible.
 * Vecino más cercano desde `inicio` (tu ubicación, si la diste) y luego 2-opt.
 * Con 10–15 paradas en una zona caminable queda a pocos metros del óptimo,
 * corre en el celular en menos de 1 ms y no gasta llamadas a ningún servicio.
 */
export function ordenarPorCercania<T extends Parada>(paradas: T[], inicio?: Punto | null): T[] {
  if (paradas.length <= 2 && !inicio) return [...paradas];
  const pendientes = [...paradas];
  const orden: T[] = [];
  let actual: Punto | undefined = inicio ?? undefined;
  if (!actual) {
    actual = pendientes.shift()!;
    orden.push(actual as T);
  }
  while (pendientes.length) {
    let mejor = 0;
    let mejorD = Infinity;
    for (let i = 0; i < pendientes.length; i++) {
      const d = distanciaM(actual, pendientes[i]!);
      if (d < mejorD) { mejorD = d; mejor = i; }
    }
    actual = pendientes.splice(mejor, 1)[0]!;
    orden.push(actual as T);
  }
  return dosOpt(orden, inicio ?? null);
}

// 2-opt para recorrido abierto: invierte tramos mientras el recorrido se acorte.
function dosOpt<T extends Parada>(ruta: T[], inicio: Punto | null): T[] {
  const r = [...ruta];
  const pt = (i: number): Punto => (i < 0 ? (inicio as Punto) : r[i]!);
  const desde = inicio ? -1 : 0; // con inicio fijo, el primer tramo también se puede mejorar
  let mejoro = true;
  let vueltas = 0;
  while (mejoro && vueltas++ < 50) {
    mejoro = false;
    for (let i = desde; i < r.length - 2; i++) {
      for (let k = i + 2; k < r.length; k++) {
        const a = pt(i), b = r[i + 1]!, c = r[k]!;
        const d = k + 1 < r.length ? r[k + 1]! : null;
        const antes = distanciaM(a, b) + (d ? distanciaM(c, d) : 0);
        const despues = distanciaM(a, c) + (d ? distanciaM(b, d) : 0);
        if (despues + 0.01 < antes) {
          const tramo = r.slice(i + 1, k + 1).reverse();
          r.splice(i + 1, tramo.length, ...tramo);
          mejoro = true;
        }
      }
    }
  }
  return r;
}

const MODO_GOOGLE: Record<Modo, string> = { a_pie: 'walking', bici: 'bicycling', carro: 'driving' };
const coord = (p: Punto) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

/** Botón "Ir": abre Google Maps con indicaciones hasta una parada, desde donde estés. */
export function enlaceIrA(p: Punto, modo: Modo = 'a_pie'): string {
  const q = new URLSearchParams({ api: '1', destination: coord(p), travelmode: MODO_GOOGLE[modo] });
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

/**
 * "Abrir toda la ruta en Google Maps", partida en tramos.
 * Google Maps acepta como mucho 3 puntos intermedios cuando el enlace abre en el
 * navegador del celular (9 en otros casos), así que cada tramo lleva hasta 3 + el destino.
 * El primer tramo sale de tu ubicación (sin `origin`); los siguientes, del final del anterior.
 */
export function tramosGoogleMaps(paradas: Punto[], modo: Modo = 'a_pie', maxIntermedios = 3): string[] {
  const urls: string[] = [];
  let origen: Punto | null = null;
  for (let i = 0; i < paradas.length; i += maxIntermedios + 1) {
    const grupo = paradas.slice(i, i + maxIntermedios + 1);
    const destino = grupo[grupo.length - 1]!;
    const q = new URLSearchParams({ api: '1', destination: coord(destino), travelmode: MODO_GOOGLE[modo] });
    if (origen) q.set('origin', coord(origen));
    const intermedios = grupo.slice(0, -1);
    if (intermedios.length) q.set('waypoints', intermedios.map(coord).join('|'));
    urls.push(`https://www.google.com/maps/dir/?${q.toString()}`);
    origen = destino;
  }
  return urls;
}

/**
 * Saca coordenadas de un enlace largo de Google Maps pegado por el usuario.
 * Entiende `@4.63,-74.06,17z`, `!3d4.63!4d-74.06`, `?q=4.63,-74.06` y `?ll=`.
 * Los enlaces cortos (maps.app.goo.gl) se resuelven en el servidor siguiendo la
 * redirección y luego pasan por aquí (ver docs/ARQUITECTURA.md · Mapa).
 */
export function leerEnlaceMaps(texto: string): Punto | null {
  const t = decodeURIComponent(texto.trim());
  const patrones = [
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, // el pin exacto del lugar, si viene
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /^(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)$/, // "4.6336, -74.0660" pegado tal cual
  ];
  for (const re of patrones) {
    const m = t.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

/** "2,4 km · 31 min a pie" — texto corto para la tarjeta de la ruta. */
export function resumenRuta(metros: number, segundos: number, modo: Modo = 'a_pie'): string {
  const km = metros < 1000
    ? `${Math.round(metros / 10) * 10} m`
    : `${(metros / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} km`;
  const min = Math.max(1, Math.round(segundos / 60));
  const tiempo = min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
  const sufijo = { a_pie: 'a pie', bici: 'en bici', carro: 'en carro' }[modo];
  return `${km} · ${tiempo} ${sufijo}`;
}

/** Estimado sin red: línea recta × 1,3 (calles en cuadrícula) a 4,5 km/h caminando. */
export function estimarCaminata(paradas: Punto[], inicio?: Punto | null): { metros: number; segundos: number } {
  const metros = Math.round(largoRecorridoM(paradas, inicio) * 1.3);
  return { metros, segundos: Math.round(metros / (4500 / 3600)) };
}
