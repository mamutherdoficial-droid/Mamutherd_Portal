"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Mapa del portal (D-044): MapLibre + OpenFreeMap, sin llave. Se importa con next/dynamic (ssr: false)
// para que su JS solo baje en /ruta y en la vista de mapa de /ventas. Aspecto: docs/referencias/ruta-prototipo.html.

export type PinMapa = {
  id: string;
  lat: number;
  lng: number;
  /** Texto dentro de la gota (número de parada o vacío). */
  texto?: string;
  /** Clases: estado de la parada (pendiente, visitada, saltada, siguiente, activa) o etapa (etapa-ganada…). */
  clases: string[];
  etiqueta: string;
};

type Props = {
  pines: PinMapa[];
  /** Línea de la ruta, en [lng, lat]. */
  linea?: [number, number][] | null;
  /** Tu ubicación (no se guarda, D-046). */
  yo?: { lat: number; lng: number } | null;
  /** Al cambiar, el mapa se acerca a ese pin. */
  enfocar?: string | null;
  /** Al cambiar, el mapa encuadra todos los pines. */
  encuadre?: number;
  /** Alto que tapa la hoja inferior en el celular, para no esconder pines debajo. */
  rellenoAbajo?: number;
  /** Panel fijo a la izquierda en escritorio (px). */
  rellenoIzquierda?: number;
  alTocar?: (id: string) => void;
  centroInicial?: [number, number];
};

const BOGOTA: [number, number] = [-74.0655, 4.638];

function esOscuro(): boolean {
  const fondo = getComputedStyle(document.body).backgroundColor; // "rgb(r, g, b)"
  const [r = 255, g = 255, b = 255] = (fondo.match(/\d+/g) ?? []).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export default function Mapa({ pines, linea, yo, enfocar, encuadre = 0, rellenoAbajo = 0, rellenoIzquierda = 0, alTocar, centroInicial }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const listo = useRef(false);
  // Lo que se pide antes de que cargue el estilo espera aquí y corre al cargar.
  const cola = useRef<(() => void)[]>([]);
  const alListo = (fn: () => void) => (listo.current ? fn() : cola.current.push(fn));
  const marcadores = useRef(new Map<string, maplibregl.Marker>());
  const yoMarca = useRef<maplibregl.Marker | null>(null);
  const tocar = useRef(alTocar);
  useEffect(() => {
    tocar.current = alTocar;
  }, [alTocar]);

  const relleno = () => ({ top: 90, bottom: rellenoAbajo + 24, left: rellenoIzquierda + 50, right: 50 });

  // Crear el mapa una vez.
  useEffect(() => {
    if (!caja.current) return;
    const oscuro = esOscuro();
    const m = new maplibregl.Map({
      container: caja.current,
      style: `https://tiles.openfreemap.org/styles/${oscuro ? "dark" : "positron"}`,
      center: centroInicial ?? BOGOTA,
      zoom: 14.6,
      attributionControl: { compact: true },
    });
    mapa.current = m;
    const marcas = marcadores.current;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cuadro = 0;
    m.on("load", () => {
      // Mapa base calmado: fondo del portal, agua y parques muy suaves.
      for (const l of m.getStyle().layers ?? []) {
        if (l.type === "background") m.setPaintProperty(l.id, "background-color", css("--fondo"));
        if (l.type === "fill" && /water/.test(l.id)) m.setPaintProperty(l.id, "fill-color", oscuro ? "#1d2630" : "#dce7ee");
        if (l.type === "fill" && /park|landcover|grass|wood/.test(l.id)) m.setPaintProperty(l.id, "fill-color", oscuro ? "#1b2420" : "#e5efe3");
      }
      m.addSource("ruta", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({ id: "ruta-borde", type: "line", source: "ruta", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": css("--superficie"), "line-width": 9 } });
      m.addLayer({ id: "ruta", type: "line", source: "ruta", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": css("--principal"), "line-width": 5 } });
      m.addLayer({ id: "ruta-hormigas", type: "line", source: "ruta", layout: { "line-join": "round" }, paint: { "line-color": css("--superficie"), "line-width": 2, "line-opacity": 0.85, "line-dasharray": [0, 4, 3] } });
      if (!reducir) {
        const seq = [[0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]];
        let paso = -1;
        const anim = (t: number) => {
          const s = Math.floor(t / 60) % seq.length;
          if (s !== paso && m.getLayer("ruta-hormigas")) {
            m.setPaintProperty("ruta-hormigas", "line-dasharray", seq[s]);
            paso = s;
          }
          cuadro = requestAnimationFrame(anim);
        };
        cuadro = requestAnimationFrame(anim);
      }
      listo.current = true;
      for (const fn of cola.current.splice(0)) fn();
    });
    return () => {
      cancelAnimationFrame(cuadro);
      listo.current = false;
      marcas.clear();
      m.remove();
      mapa.current = null;
    };
    // Se crea una sola vez; lo demás se actualiza en los efectos de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pines.
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const vivos = new Set(pines.map((p) => p.id));
    for (const [id, mk] of marcadores.current) {
      if (!vivos.has(id)) {
        mk.remove();
        marcadores.current.delete(id);
      }
    }
    for (const p of pines) {
      let mk = marcadores.current.get(p.id);
      if (!mk) {
        const el = document.createElement("button");
        el.type = "button";
        el.innerHTML = '<div class="gota"><span></span></div>';
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          tocar.current?.(p.id);
        });
        mk = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lng, p.lat]).addTo(m);
        marcadores.current.set(p.id, mk);
      } else mk.setLngLat([p.lng, p.lat]);
      const el = mk.getElement();
      el.className = ["pin-mapa", ...p.clases].join(" ");
      el.setAttribute("aria-label", p.etiqueta);
      el.setAttribute("data-testid", "pin");
      el.querySelector("span")!.textContent = p.texto ?? "";
    }
  }, [pines]);

  // Línea de la ruta.
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const poner = () => {
      const fuente = m.getSource("ruta") as maplibregl.GeoJSONSource | undefined;
      fuente?.setData({
        type: "FeatureCollection",
        features: linea && linea.length > 1 ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: linea } }] : [],
      });
    };
    alListo(poner);
  }, [linea]);

  // Tu ubicación.
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    if (!yo) {
      yoMarca.current?.remove();
      yoMarca.current = null;
      return;
    }
    if (!yoMarca.current) {
      const el = document.createElement("div");
      el.className = "yo-mapa";
      el.setAttribute("aria-label", "Tu ubicación");
      yoMarca.current = new maplibregl.Marker({ element: el }).setLngLat([yo.lng, yo.lat]).addTo(m);
    } else yoMarca.current.setLngLat([yo.lng, yo.lat]);
  }, [yo]);

  // Encuadrar todo (al cargar y cuando lo piden).
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const hacer = () => {
      const puntos = [...pines.map((p) => [p.lng, p.lat] as [number, number]), ...(yo ? [[yo.lng, yo.lat] as [number, number]] : [])];
      if (puntos.length === 0) return;
      const b = new maplibregl.LngLatBounds(puntos[0], puntos[0]);
      for (const p of puntos) b.extend(p);
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      m.fitBounds(b, { padding: relleno(), duration: reducir || encuadre === 0 ? 0 : 600, maxZoom: 16.5 });
    };
    alListo(hacer);
    // Solo cuando cambia `encuadre` (y al inicio).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadre]);

  // Acercar a un pin, sin que quede debajo de la hoja (padding, no offset).
  useEffect(() => {
    const m = mapa.current;
    const p = pines.find((x) => x.id === enfocar);
    if (!m || !p) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    m.easeTo({ center: [p.lng, p.lat], zoom: 16.8, padding: relleno(), duration: reducir ? 0 : 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enfocar]);

  return <div ref={caja} className="absolute inset-0" role="region" aria-label="Mapa" data-testid="mapa" />;
}
