"use client";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/marca/Logo";
import { Boton } from "@/components/ui/Boton";
import { cx } from "@/components/ui/clases";
import type { Recorrido } from "@/lib/recorridos";

/** Onboarding Tutorial: bienvenida de 3 pantallas al primer ingreso. Siempre se puede saltar. */
export function Bienvenida({
  recorrido,
  alTerminar,
  alSaltar,
}: {
  recorrido: Recorrido;
  alTerminar: () => void;
  alSaltar: () => void;
}) {
  const [i, setI] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const paso = recorrido.pasos[i]!;
  const ultimo = i === recorrido.pasos.length - 1;

  useEffect(() => {
    caja.current?.focus();
  }, [i]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") alSaltar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [alSaltar]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#0f1e2e]/60 p-0 motion-safe:animate-[aparecer_200ms_ease-out] sm:place-items-center sm:p-6">
      <div
        ref={caja}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bienvenida-titulo"
        aria-describedby="bienvenida-texto"
        data-testid="bienvenida"
        className="flex w-full max-w-md flex-col gap-5 rounded-t-tarjeta bg-superficie p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl outline-none sm:rounded-tarjeta"
      >
        <Logo logo="simbolo" alto={40} decorativo />
        <div aria-live="polite">
          <p className="text-chico font-semibold text-tinta-suave">
            {i + 1} de {recorrido.pasos.length}
          </p>
          <h2 id="bienvenida-titulo" className="font-titulo text-titulo leading-tight">
            {paso.titulo}
          </h2>
          <p id="bienvenida-texto" className="mt-2 text-medio">
            {paso.texto}
          </p>
        </div>
        <div className="flex justify-center gap-1.5" aria-hidden>
          {recorrido.pasos.map((_, k) => (
            <span key={k} className={cx("h-1.5 rounded-full", k === i ? "w-6 bg-ambar" : "w-1.5 bg-glaciar")} />
          ))}
        </div>
        <div className="flex gap-2">
          <Boton variante="fantasma" onClick={alSaltar} className="flex-1">
            Saltar
          </Boton>
          <Boton onClick={() => (ultimo ? alTerminar() : setI(i + 1))} className="flex-[2]">
            {ultimo ? "Anotar mi primera visita" : "Siguiente"}
          </Boton>
        </div>
      </div>
    </div>
  );
}
