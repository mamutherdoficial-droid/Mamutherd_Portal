"use client";
import { useState } from "react";
import { cx } from "@/components/ui/clases";

type Paso = { titulo: string; hace: string; ve: string; truco: string };

/** "Cómo se usa, en 5 pasos", interactivo: se elige el paso y se ve qué haces, qué ves y el truco. */
export function CincoPasos({ pasos }: { pasos: Paso[] }) {
  const [i, setI] = useState(0);
  const p = pasos[i]!;
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Pasos" className="flex flex-wrap gap-2">
        {pasos.map((x, k) => (
          <button
            key={x.titulo}
            type="button"
            role="tab"
            id={`paso-${k}`}
            aria-selected={i === k}
            aria-controls="paso-panel"
            onClick={() => setI(k)}
            className={cx(
              "inline-flex min-h-12 items-center gap-2 rounded-full border px-4 font-semibold transition-colors",
              i === k ? "border-principal bg-principal text-sobre-principal" : "border-borde bg-superficie hover:bg-suave",
            )}
          >
            <span className="numeros">{k + 1}</span> {x.titulo}
          </button>
        ))}
      </div>
      <div id="paso-panel" role="tabpanel" aria-labelledby={`paso-${i}`} className="grid gap-3 rounded-tarjeta border border-borde bg-superficie p-5 sm:grid-cols-3" data-testid="paso-portada">
        <div>
          <p className="text-chico font-semibold text-tinta-suave">Qué haces</p>
          <p>{p.hace}</p>
        </div>
        <div>
          <p className="text-chico font-semibold text-tinta-suave">Qué ves</p>
          <p>{p.ve}</p>
        </div>
        <div>
          <p className="text-chico font-semibold text-tinta-suave">Truco</p>
          <p>{p.truco}</p>
        </div>
      </div>
    </div>
  );
}
