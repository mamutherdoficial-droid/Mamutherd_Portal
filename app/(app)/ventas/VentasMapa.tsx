"use client";
import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPinPlus, X } from "lucide-react";
import { BotonWhatsapp } from "@/components/dominio/BotonWhatsapp";
import type { PinMapa } from "@/components/mapa/Mapa";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { agregarParada } from "@/lib/acciones/mapa";
import type { OportunidadFila } from "@/lib/datos";
import type { NegocioUbicado } from "@/lib/datos-mapa";
import { NOMBRE_ETAPA, esEtapa } from "@/lib/dominio/etapas";

const Mapa = dynamic(() => import("@/components/mapa/Mapa"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-suave" aria-label="Cargando el mapa" />,
});

/** Mapa de clientes (Fase 1b): pines por etapa; al tocar uno, su tarjeta corta. */
export function VentasMapa({ negocios, oportunidades, quien }: { negocios: NegocioUbicado[]; oportunidades: OportunidadFila[]; quien: string }) {
  const avisar = useAvisar();
  const [elegido, setElegido] = useState<string | null>(null);
  const [verPerdidas, setVerPerdidas] = useState(false);
  const [pendiente, iniciar] = useTransition();

  // La venta más reciente de cada negocio define el color del pin.
  const ventaDe = useMemo(() => {
    const m = new Map<string, OportunidadFila>();
    for (const o of oportunidades) {
      const ya = m.get(o.cliente.id);
      if (!ya || o.creado_en > ya.creado_en) m.set(o.cliente.id, o);
    }
    return m;
  }, [oportunidades]);

  const pines: PinMapa[] = useMemo(
    () =>
      negocios
        .filter((n) => verPerdidas || ventaDe.get(n.id)?.etapa !== "perdida")
        .map((n) => {
          const etapa = ventaDe.get(n.id)?.etapa ?? "ninguna";
          return { id: n.id, lat: n.lat, lng: n.lng, texto: "", clases: [`etapa-${etapa}`, elegido === n.id ? "activa" : ""].filter(Boolean), etiqueta: n.nombre };
        }),
    [negocios, ventaDe, verPerdidas, elegido],
  );

  const negocio = negocios.find((n) => n.id === elegido);
  const venta = elegido ? ventaDe.get(elegido) : undefined;

  if (negocios.length === 0) {
    return (
      <p className="rounded-tarjeta border border-borde bg-superficie p-4 text-tinta-suave">
        Todavía no hay negocios en el mapa. Al anotar una visita con «Estoy en el negocio», el negocio aparece aquí.
      </p>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-16rem)] min-h-80 overflow-hidden rounded-tarjeta border border-borde" data-testid="ventas-mapa">
      <Mapa pines={pines} enfocar={elegido} rellenoAbajo={negocio ? 200 : 0} alTocar={setElegido} />
      <label className="absolute left-3 top-3 z-10 flex min-h-11 items-center gap-2 rounded-full border border-borde bg-superficie/90 px-3 text-chico font-semibold shadow backdrop-blur">
        <input type="checkbox" checked={verPerdidas} onChange={(e) => setVerPerdidas(e.target.checked)} /> Ver perdidas
      </label>
      {negocio && (
        <div className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2 rounded-tarjeta border border-borde bg-superficie p-4 shadow-lg lg:right-auto lg:w-96" data-testid="tarjeta-pin">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/clientes/${negocio.id}`} className="block truncate text-medio font-bold hover:underline">
                {negocio.nombre}
              </Link>
              <p className="text-chico text-tinta-suave">
                {venta && esEtapa(venta.etapa) ? NOMBRE_ETAPA[venta.etapa] : "Sin venta"}
                {venta?.proxima_accion && ` · ${venta.proxima_accion}`}
              </p>
            </div>
            <button type="button" aria-label="Cerrar" onClick={() => setElegido(null)} className="grid size-9 place-items-center rounded-control hover:bg-suave">
              <X size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Boton
              disabled={pendiente}
              icono={<MapPinPlus size={20} strokeWidth={1.75} aria-hidden />}
              onClick={() =>
                iniciar(async () => {
                  const r = await agregarParada(negocio.id);
                  avisar(r.ok ? (r.mensaje ?? "Agregado") : r.error, r.ok ? "bien" : "error");
                })
              }
            >
              Agregar a la ruta de hoy
            </Boton>
            {venta && (
              <BotonWhatsapp compacto whatsapp={venta.cliente.whatsapp} contacto={venta.cliente.contacto} negocio={negocio.nombre} producto={venta.producto.nombre} quien={quien} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
