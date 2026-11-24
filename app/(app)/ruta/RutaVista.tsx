"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ClipboardList, ExternalLink, Maximize, Navigation, Plus, SkipForward, X } from "lucide-react";
import { HojaAnotarVisita } from "@/components/dominio/AnotarVisita";
import type { PinMapa } from "@/components/mapa/Mapa";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { cx } from "@/components/ui/clases";
import { Hoja } from "@/components/ui/Hoja";
import { agregarParada, calcularRuta, pegarLugares, quitarParada, reordenarRuta, saltarParada } from "@/lib/acciones/mapa";
import type { ClienteCorto, Producto } from "@/lib/datos";
import type { ParadaVista, RutaVista as Ruta } from "@/lib/datos-mapa";
import { enlaceIrA, estimarCaminata, ordenarPorCercania, resumenRuta, tramosGoogleMaps, type Punto } from "@/lib/dominio/ruta";

// El mapa (MapLibre) solo se descarga en esta pantalla y en el mapa de ventas.
const Mapa = dynamic(() => import("@/components/mapa/Mapa"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-suave" aria-label="Cargando el mapa" />,
});

const ubicada = (p: ParadaVista): p is ParadaVista & Punto => p.lat != null && p.lng != null;

function miUbicacion(): Promise<Punto | null> {
  return new Promise((ok) => {
    if (!navigator.geolocation) return ok(null);
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => ok(null),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60_000 },
    );
  });
}

type Props = { ruta: Ruta; clientes: ClienteCorto[]; productos: Producto[]; titulo: string; esHoy: boolean };

/** Ruta del día (Fase 1b): mapa + hoja con "Siguiente", ordenar, anotar y la lista de paradas. */
export function RutaVista({ ruta, clientes, productos, titulo, esHoy }: Props) {
  const avisar = useAvisar();
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [activa, setActiva] = useState<string | null>(null);
  const [encuadre, setEncuadre] = useState(0);
  const [abierta, setAbierta] = useState(false); // la hoja en el celular (baja / alta)
  const [anotando, setAnotando] = useState(false);
  const [pegando, setPegando] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [yo, setYo] = useState<Punto | null>(null);

  const paradas = ruta.paradas;
  const siguiente = paradas.find((p) => p.estado === "pendiente") ?? null;
  const hechas = paradas.filter((p) => p.estado === "visitada").length;
  const aproximada = !ruta.geometria;

  // Línea por las calles: se calcula cuando falta (una llamada por cambio; D-045).
  useEffect(() => {
    if (!ruta.geometria && paradas.filter(ubicada).length >= 2) {
      void calcularRuta(ruta.id).then((r) => {
        if (r.ok && !r.datos?.aproximada) router.refresh();
      });
    }
  }, [ruta.id, ruta.geometria, paradas, router]);

  const pines: PinMapa[] = useMemo(
    () =>
      paradas.filter(ubicada).map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        texto: p.estado === "visitada" ? "✓" : String(paradas.indexOf(p) + 1),
        clases: [p.estado, siguiente?.id === p.id ? "siguiente" : "", activa === p.id ? "activa" : ""].filter(Boolean),
        etiqueta: `${paradas.indexOf(p) + 1}. ${p.nombre}`,
      })),
    [paradas, siguiente, activa],
  );

  const linea: [number, number][] | null = useMemo(() => {
    if (ruta.geometria) return ruta.geometria.coordinates;
    const puntos = paradas.filter((p) => p.estado !== "saltada").filter(ubicada);
    return puntos.length > 1 ? puntos.map((p) => [p.lng, p.lat]) : null;
  }, [ruta.geometria, paradas]);

  const pendientesUbicadas = paradas.filter((p) => p.estado === "pendiente").filter(ubicada);
  const resumen = ruta.distancia_m != null && ruta.duracion_s != null && ruta.geometria
    ? resumenRuta(ruta.distancia_m, ruta.duracion_s, ruta.modo)
    : (() => {
        const e = estimarCaminata(pendientesUbicadas);
        return pendientesUbicadas.length > 1 ? resumenRuta(e.metros, e.segundos) : null;
      })();

  function ordenar() {
    iniciar(async () => {
      const antes = estimarCaminata(pendientesUbicadas).metros;
      const desdeGps = await miUbicacion();
      if (desdeGps) setYo(desdeGps);
      const hechasYSaltadas = paradas.filter((p) => p.estado !== "pendiente");
      const ultimaHecha = [...hechasYSaltadas].reverse().find(ubicada);
      const inicio = desdeGps ?? (ultimaHecha ? { lat: ultimaHecha.lat!, lng: ultimaHecha.lng! } : null);
      const ordenadas = ordenarPorCercania(pendientesUbicadas, inicio);
      const sinUbicar = paradas.filter((p) => p.estado === "pendiente" && !ubicada(p));
      const nuevo = [...hechasYSaltadas, ...ordenadas, ...sinUbicar].map((p) => p.id);
      const r = await reordenarRuta(ruta.id, nuevo);
      if (!r.ok) return avisar(r.error, "error");
      const despues = estimarCaminata(ordenadas, inicio).metros;
      const km = (m: number) => `${(m / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} km`;
      avisar(`Ruta ordenada: ${km(despues)}${antes > 0 ? ` (antes ${km(antes)})` : ""}`);
      setEncuadre((n) => n + 1);
      router.refresh();
    });
  }

  function accion(fn: () => Promise<{ ok: boolean; mensaje?: string; error?: string }>) {
    iniciar(async () => {
      const r = await fn();
      avisar(r.ok ? (r.mensaje ?? "Listo") : (r.error ?? "No se pudo"), r.ok ? "bien" : "error");
      router.refresh();
    });
  }

  function subirBajar(id: string, delta: -1 | 1) {
    const ids = paradas.map((p) => p.id);
    const i = ids.indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    accion(() => reordenarRuta(ruta.id, ids));
  }

  const tramos = tramosGoogleMaps(paradas.filter((p) => p.estado === "pendiente").filter(ubicada), ruta.modo);

  return (
    <div className="relative -mx-4 -mt-5 h-[calc(100dvh-8.5rem)] overflow-hidden sm:-mx-6 lg:-mx-10 lg:-mt-8 lg:h-[calc(100dvh-2rem)]" data-testid="ruta">
      <Mapa pines={pines} linea={linea} yo={yo} enfocar={activa} encuadre={encuadre} rellenoAbajo={abierta ? 420 : 260} rellenoIzquierda={0} alTocar={setActiva} />

      {/* Barra de arriba (cristal) */}
      <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-2 lg:right-auto lg:w-[380px]">
        <div className="flex min-h-12 min-w-0 flex-1 flex-col justify-center rounded-full border border-borde bg-superficie/90 px-4 shadow-lg backdrop-blur" data-recorrido="ruta-titulo">
          <b className="truncate text-chico">{ruta.nombre}</b>
          <span className="truncate text-chico text-tinta-suave">{titulo}</span>
        </div>
        <button type="button" aria-label="Ver toda la ruta" onClick={() => setEncuadre((n) => n + 1)} className="grid size-12 place-items-center rounded-full border border-borde bg-superficie/90 shadow-lg backdrop-blur">
          <Maximize size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {/* Hoja inferior (celular) / panel izquierdo (PC) */}
      <section
        className={cx(
          "absolute inset-x-0 bottom-0 z-10 flex max-h-[70%] flex-col rounded-t-[22px] border-t border-borde bg-superficie px-4 pb-4 pt-2 shadow-[0_-12px_40px_rgb(15_30_46/0.16)] transition-transform duration-200",
          "lg:inset-y-4 lg:left-4 lg:right-auto lg:max-h-none lg:w-[380px] lg:translate-y-0 lg:rounded-[22px] lg:border",
          abierta ? "translate-y-0" : "translate-y-[calc(100%-15.5rem)]",
        )}
        aria-label="Paradas de la ruta"
      >
        <button type="button" onClick={() => setAbierta(!abierta)} aria-label={abierta ? "Bajar la lista" : "Subir la lista"} className="mx-auto mb-2 h-6 w-16 shrink-0 lg:hidden">
          <span className="mx-auto block h-1.5 w-10 rounded-full bg-borde" />
        </button>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-medio font-bold" data-testid="avance-ruta">
            <span className="numeros">{hechas}</span> de <span className="numeros">{paradas.length}</span> visitas
          </h2>
          <p className="numeros text-chico text-tinta-suave">
            {resumen ?? "—"}
            {aproximada && resumen && " · Línea aproximada"}
          </p>
        </div>
        <div className="my-2.5 h-1.5 overflow-hidden rounded-full bg-suave">
          <div className="h-full origin-left rounded-full bg-principal transition-transform duration-200" style={{ transform: `scaleX(${paradas.length ? hechas / paradas.length : 0})` }} />
        </div>

        {siguiente ? (
          <div className="flex items-center gap-3 rounded-[14px] bg-suave p-3" data-testid="siguiente" data-recorrido="ruta-siguiente">
            <div className="min-w-0 flex-1">
              <small className="text-chico font-bold uppercase tracking-wide text-tinta-suave">Siguiente</small>
              <b className="block truncate text-medio">{siguiente.nombre}</b>
              <span className="block truncate text-chico text-tinta-suave">{siguiente.direccion || siguiente.barrio || siguiente.proxima_accion || (ubicada(siguiente) ? "" : "Sin ubicar")}</span>
            </div>
            {ubicada(siguiente) ? (
              <a href={enlaceIrA(siguiente, ruta.modo)} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-control bg-principal px-4 font-semibold text-sobre-principal">
                <Navigation size={18} strokeWidth={1.75} aria-hidden /> Ir
              </a>
            ) : (
              <span className="rounded-full border border-borde px-2 py-1 text-chico text-tinta-suave">Sin ubicar</span>
            )}
          </div>
        ) : (
          paradas.length > 0 && <p className="rounded-[14px] bg-suave p-3 font-semibold">¡Ruta terminada! 🎉</p>
        )}

        {esHoy && (
          <div className="mt-3 flex gap-2">
            <Boton variante="secundario" className="flex-1" disabled={pendiente || pendientesUbicadas.length < 2} onClick={ordenar} data-recorrido="ruta-ordenar">
              Ordenar por cercanía
            </Boton>
            <Boton variante="secundario" className="flex-1" disabled={!siguiente} onClick={() => setAnotando(true)}>
              Anota la visita
            </Boton>
          </div>
        )}

        <ol className="mt-2 min-h-0 flex-1 overflow-y-auto" data-testid="paradas">
          {paradas.map((p, i) => (
            <li key={p.id} className={cx("flex items-center gap-2 border-b border-borde py-2.5 last:border-0", p.estado === "saltada" && "opacity-60")} data-testid="parada">
              <button type="button" onClick={() => ubicada(p) && setActiva(p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className={cx("numeros grid size-7 shrink-0 place-items-center rounded-full text-chico font-bold", p.estado === "visitada" ? "bg-bien text-white" : "bg-suave text-tinta")}>
                  {p.estado === "visitada" ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <b className={cx("block truncate font-semibold", p.estado === "visitada" && "text-tinta-suave line-through")}>{p.nombre}</b>
                  <span className="block truncate text-chico text-tinta-suave">
                    {[p.tipo, p.direccion || p.barrio].filter(Boolean).join(" · ") || (p.estado === "saltada" ? "Saltada" : "")}
                    {!ubicada(p) && <span className="ml-1 rounded-full border border-borde px-1.5">Sin ubicar</span>}
                  </span>
                </span>
              </button>
              {esHoy && p.estado === "pendiente" && (
                <span className="flex shrink-0 items-center">
                  <button type="button" aria-label={`Subir ${p.nombre}`} disabled={pendiente || i === 0} onClick={() => subirBajar(p.id, -1)} className="grid size-9 place-items-center rounded-control hover:bg-suave disabled:opacity-30">
                    <ArrowUp size={16} strokeWidth={1.75} aria-hidden />
                  </button>
                  <button type="button" aria-label={`Bajar ${p.nombre}`} disabled={pendiente || i === paradas.length - 1} onClick={() => subirBajar(p.id, 1)} className="grid size-9 place-items-center rounded-control hover:bg-suave disabled:opacity-30">
                    <ArrowDown size={16} strokeWidth={1.75} aria-hidden />
                  </button>
                  <button type="button" aria-label={`Saltar ${p.nombre}`} disabled={pendiente} onClick={() => accion(() => saltarParada(p.id))} className="grid size-9 place-items-center rounded-control hover:bg-suave">
                    <SkipForward size={16} strokeWidth={1.75} aria-hidden />
                  </button>
                  <button type="button" aria-label={`Quitar ${p.nombre}`} disabled={pendiente} onClick={() => accion(() => quitarParada(p.id))} className="grid size-9 place-items-center rounded-control hover:bg-suave">
                    <X size={16} strokeWidth={1.75} aria-hidden />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>

        {esHoy && (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-borde pt-2">
            <Boton variante="fantasma" onClick={() => setPegando(true)} icono={<ClipboardList size={18} strokeWidth={1.75} aria-hidden />} data-recorrido="ruta-pegar">
              Pegar lugares
            </Boton>
            <Boton variante="fantasma" onClick={() => setAgregando(true)} icono={<Plus size={18} strokeWidth={1.75} aria-hidden />}>
              Agregar negocio
            </Boton>
            {tramos.map((url, k) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 px-2 text-chico font-semibold underline underline-offset-4">
                <ExternalLink size={14} strokeWidth={1.75} aria-hidden /> {tramos.length > 1 ? `Google Maps (tramo ${k + 1})` : "Abrir en Google Maps"}
              </a>
            ))}
          </div>
        )}
      </section>

      {siguiente && (
        <HojaAnotarVisita abierta={anotando} alCerrar={() => setAnotando(false)} clientes={clientes} productos={productos} clienteFijo={{ id: siguiente.cliente_id, nombre: siguiente.nombre }} />
      )}
      {pegando && <PegarLugares alCerrar={() => setPegando(false)} />}
      {agregando && <AgregarNegocio clientes={clientes} enRuta={new Set(paradas.map((p) => p.cliente_id))} alCerrar={() => setAgregando(false)} />}
    </div>
  );
}

/** "Pegar lugares" (D-048): una línea por lugar → paradas de la ruta de hoy. */
export function PegarLugares({ alCerrar }: { alCerrar: () => void }) {
  const avisar = useAvisar();
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  return (
    <Hoja abierta alCerrar={alCerrar} titulo="Pegar lugares">
      <form
        className="flex flex-col gap-3"
        data-testid="form-lugares"
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            const r = await pegarLugares(texto);
            if (!r.ok) return setError(r.error);
            avisar(r.mensaje ?? "Listo");
            router.refresh();
            alCerrar();
          });
        }}
      >
        <p className="text-tinta-suave">Un lugar por línea. Después del nombre puedes poner «|» y un enlace de Google Maps, coordenadas o la dirección.</p>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Lugares</span>
          <textarea
            rows={7}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={"Café Luna | https://maps.app.goo.gl/…\nPanadería El Trigal | 4.6280, -74.0675\nHeladería Polar | Cra 13 # 45-08"}
            className="rounded-control border border-borde bg-superficie px-4 py-3 font-mono text-chico placeholder:text-tinta-suave focus:outline-2 focus:outline-tinta"
          />
        </label>
        <p className="text-chico text-tinta-suave">Si el negocio ya existe lo reutilizamos. Con solo la dirección queda «Sin ubicar» hasta que lo ubiques.</p>
        {error && (
          <p role="alert" className="font-semibold text-error">
            {error}
          </p>
        )}
        <Boton type="submit" ancho disabled={pendiente || !texto.trim()}>
          {pendiente ? "Agregando…" : "Agregar a la ruta de hoy"}
        </Boton>
      </form>
    </Hoja>
  );
}

function AgregarNegocio({ clientes, enRuta, alCerrar }: { clientes: ClienteCorto[]; enRuta: Set<string>; alCerrar: () => void }) {
  const avisar = useAvisar();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pendiente, iniciar] = useTransition();
  const norm = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const lista = clientes.filter((c) => !enRuta.has(c.id) && norm(c.nombre).includes(norm(q))).slice(0, 20);
  return (
    <Hoja abierta alCerrar={alCerrar} titulo="Agregar a la ruta">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca el negocio"
          aria-label="Busca el negocio"
          className="min-h-12 rounded-control border border-borde bg-superficie px-4"
        />
        <ul className="flex flex-col divide-y divide-borde">
          {lista.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  iniciar(async () => {
                    const r = await agregarParada(c.id);
                    avisar(r.ok ? (r.mensaje ?? "Agregado") : r.error, r.ok ? "bien" : "error");
                    router.refresh();
                    alCerrar();
                  })
                }
                className="flex min-h-12 w-full items-center justify-between gap-2 px-1 text-left hover:bg-suave"
              >
                <span className="font-semibold">{c.nombre}</span>
                <span className="text-chico text-tinta-suave">{c.barrio}</span>
              </button>
            </li>
          ))}
          {lista.length === 0 && <li className="py-3 text-tinta-suave">No hay más negocios con ese nombre. Usa «Pegar lugares» para crear uno.</li>}
        </ul>
      </div>
    </Hoja>
  );
}
