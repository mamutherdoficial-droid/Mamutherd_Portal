"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, LocateFixed, MapPin, MapPinPlus } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { agregarParada, ubicarCliente, ubicarConEnlace } from "@/lib/acciones/mapa";
import { enlaceIrA } from "@/lib/dominio/ruta";

const FUENTE: Record<string, string> = { gps: "con el GPS en el negocio", mapa: "en el mapa", enlace: "con un enlace de Google Maps" };

/** Dónde está el negocio (D-046: solo el negocio, nunca la persona) y "Agregar a la ruta de hoy". */
export function UbicacionNegocio({ clienteId, lat, lng, fuente }: { clienteId: string; lat: number | null; lng: number | null; fuente: string | null }) {
  const avisar = useAvisar();
  const router = useRouter();
  const [enlace, setEnlace] = useState("");
  const [pegando, setPegando] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const ubicado = lat != null && lng != null;

  function conGps() {
    if (!navigator.geolocation) return avisar("Este celular no comparte su ubicación.", "error");
    iniciar(async () => {
      const p = await new Promise<{ lat: number; lng: number } | null>((ok) =>
        navigator.geolocation.getCurrentPosition(
          (x) => ok({ lat: x.coords.latitude, lng: x.coords.longitude }),
          () => ok(null),
          { enableHighAccuracy: true, timeout: 8000 },
        ),
      );
      if (!p) return avisar("No pudimos leer tu ubicación. Revisa el permiso del navegador.", "error");
      const r = await ubicarCliente(clienteId, p, "gps", true);
      avisar(r.ok ? "Negocio ubicado" : r.error, r.ok ? "bien" : "error");
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-borde pt-3" data-testid="ubicacion-negocio">
      <p className="flex items-center gap-2">
        <MapPin size={18} strokeWidth={1.75} aria-hidden className="shrink-0 text-tinta-suave" />
        {ubicado ? (
          <span>
            En el mapa {fuente ? FUENTE[fuente] : ""} ·{" "}
            <a href={enlaceIrA({ lat, lng })} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
              Cómo llegar
            </a>
          </span>
        ) : (
          <span className="font-semibold text-alerta">Sin ubicar</span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Boton variante="secundario" disabled={pendiente} onClick={conGps} icono={<LocateFixed size={18} strokeWidth={1.75} aria-hidden />}>
          Estoy aquí
        </Boton>
        <Boton variante="fantasma" onClick={() => setPegando(!pegando)} icono={<Link2 size={18} strokeWidth={1.75} aria-hidden />}>
          Pegar enlace de Google Maps
        </Boton>
        <Boton
          variante="fantasma"
          disabled={pendiente}
          icono={<MapPinPlus size={18} strokeWidth={1.75} aria-hidden />}
          onClick={() =>
            iniciar(async () => {
              const r = await agregarParada(clienteId);
              avisar(r.ok ? (r.mensaje ?? "Agregado") : r.error, r.ok ? "bien" : "error");
            })
          }
        >
          Agregar a la ruta de hoy
        </Boton>
      </div>
      {pegando && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await ubicarConEnlace(clienteId, enlace);
              avisar(r.ok ? "Negocio ubicado" : r.error, r.ok ? "bien" : "error");
              if (r.ok) {
                setPegando(false);
                setEnlace("");
                router.refresh();
              }
            });
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-chico font-semibold">Enlace de Google Maps</span>
            <input
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="https://maps.app.goo.gl/…"
              inputMode="url"
              className="min-h-12 rounded-control border border-borde bg-superficie px-4"
            />
          </label>
          <p className="text-chico text-tinta-suave">En Google Maps: abre el negocio → Compartir → Copiar enlace.</p>
          <Boton type="submit" disabled={pendiente || !enlace.trim()} className="self-start">
            Ubicar
          </Boton>
        </form>
      )}
    </div>
  );
}
