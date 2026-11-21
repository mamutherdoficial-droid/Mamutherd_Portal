"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useRecorridos } from "./Recorridos";

/**
 * Hotspot (DESIGN.md → Tutorial guiado): punto ámbar que late sobre algo nuevo. Al tocarlo explica
 * y desaparece para siempre (se guarda en recorridos_vistos). Va dentro de un contenedor `relative`.
 * El latido es solo opacity/transform y se apaga con prefers-reduced-motion.
 */
export function Hotspot({ id, version, titulo, texto }: { id: string; version: number; titulo: string; texto: string }) {
  const { hotspotPendiente, verHotspot } = useRecorridos();
  const [abierto, setAbierto] = useState(false);
  if (!hotspotPendiente(id, version) && !abierto) return null;

  return (
    <>
      <button
        type="button"
        aria-label={`Novedad: ${titulo}`}
        aria-expanded={abierto}
        data-testid={id}
        onClick={() => setAbierto(true)}
        className="absolute -right-2 -top-2 z-10 grid size-11 place-items-center"
      >
        <span aria-hidden className="relative flex size-4">
          <span className="absolute inline-flex size-full rounded-full bg-ambar opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex size-4 rounded-full border-2 border-superficie bg-ambar" />
        </span>
      </button>
      {abierto && (
        <div
          role="dialog"
          aria-labelledby={`${id}-titulo`}
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-tarjeta bg-superficie p-4 text-tinta shadow-xl ring-1 ring-borde motion-safe:animate-[aparecer_150ms_ease-out]"
        >
          <div className="flex items-start justify-between gap-2">
            <p id={`${id}-titulo`} className="font-bold">
              {titulo}
            </p>
            <button
              type="button"
              aria-label="Entendido"
              className="-mr-2 -mt-2 grid size-11 place-items-center rounded-control hover:bg-suave"
              onClick={() => {
                setAbierto(false);
                verHotspot(id, version);
              }}
            >
              <X size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <p className="mt-1">{texto}</p>
        </div>
      )}
    </>
  );
}
