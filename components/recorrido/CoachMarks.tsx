"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import type { Recorrido } from "@/lib/recorridos";

type Caja = { top: number; left: number; width: number; height: number };
const MARGEN = 6;

function buscarObjetivo(objetivo?: string): HTMLElement | null {
  if (!objetivo) return null;
  // El primero visible (puede haber uno en el menú del celular y otro en el del PC).
  const todos = Array.from(document.querySelectorAll<HTMLElement>(`[data-recorrido="${objetivo}"]`));
  return todos.find((el) => el.getClientRects().length > 0) ?? null;
}

/**
 * Coach Marks + Tooltips: oscurece la pantalla (tinta al 60%), recorta el elemento del que se habla
 * con borde ámbar y muestra una burbuja con el paso. Esc salta. En el celular la burbuja
 * nunca tapa el botón resaltado. Los pasos cuyo elemento no está en la pantalla se saltan solos.
 */
export function CoachMarks({
  recorrido,
  alTerminar,
  alSaltar,
  alTocarObjetivo,
}: {
  recorrido: Recorrido;
  alTerminar: () => void;
  alSaltar: () => void;
  alTocarObjetivo: () => void;
}) {
  const pasos = recorrido.pasos;
  // Siguiente paso (desde k) cuyo elemento esté en la pantalla; los que no, se saltan.
  const disponibleDesde = useCallback(
    (k: number) => {
      while (k < pasos.length && pasos[k]?.objetivo && !buscarObjetivo(pasos[k]!.objetivo)) k++;
      return k;
    },
    [pasos],
  );
  const [i, setI] = useState(0);
  // La caja medida lleva el número de paso: así no se muestra la del paso anterior.
  const [medida, setMedida] = useState<{ paso: number; caja: Caja } | null>(null);
  const caja = medida?.paso === i ? medida.caja : null;
  const burbuja = useRef<HTMLDivElement>(null);
  const paso = pasos[i];
  // Última versión del callback sin volver a conectar todo cuando cambia.
  const tocarRef = useRef(alTocarObjetivo);
  useEffect(() => {
    tocarRef.current = alTocarObjetivo;
  }, [alTocarObjetivo]);

  const avanzar = useCallback(() => {
    const k = disponibleDesde(i + 1);
    if (k >= pasos.length) alTerminar();
    else setI(k);
  }, [i, pasos.length, disponibleDesde, alTerminar]);

  // Busca el elemento (si la página sigue cargando, espera hasta 5 s), lo mide y lo sigue
  // (scroll, giro de pantalla). Si el paso espera un toque, escucha el toque en ese elemento.
  useEffect(() => {
    if (!paso?.objetivo) return;
    let soltar = () => {};
    let cuadro = 0;
    let intervalo = 0;

    const conectar = (el: HTMLElement) => {
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "center", behavior: reducir ? "auto" : "smooth" });
      const medir = () => {
        const r = el.getBoundingClientRect();
        setMedida({
          paso: i,
          caja: { top: r.top - MARGEN, left: r.left - MARGEN, width: r.width + MARGEN * 2, height: r.height + MARGEN * 2 },
        });
      };
      const tocar = () => tocarRef.current();
      medir();
      const t = window.setTimeout(medir, 350);
      window.addEventListener("resize", medir);
      window.addEventListener("scroll", medir, true);
      if (paso.esperarToque) el.addEventListener("click", tocar);
      soltar = () => {
        window.clearTimeout(t);
        window.removeEventListener("resize", medir);
        window.removeEventListener("scroll", medir, true);
        el.removeEventListener("click", tocar);
      };
    };

    const ya = buscarObjetivo(paso.objetivo);
    if (ya) {
      cuadro = window.requestAnimationFrame(() => conectar(ya));
    } else {
      let intentos = 0;
      intervalo = window.setInterval(() => {
        const el = buscarObjetivo(paso.objetivo);
        if (el) {
          window.clearInterval(intervalo);
          conectar(el);
        } else if (++intentos >= 25) {
          window.clearInterval(intervalo);
          avanzar();
        }
      }, 200);
    }
    return () => {
      window.cancelAnimationFrame(cuadro);
      window.clearInterval(intervalo);
      soltar();
    };
  }, [paso, i, avanzar]);

  useEffect(() => {
    burbuja.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") alSaltar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [i, alSaltar]);

  if (!paso) return null;

  const alto = typeof window === "undefined" ? 800 : window.innerHeight;
  const abajo = caja ? caja.top + caja.height / 2 > alto / 2 : false; // elemento en la mitad de abajo → burbuja arriba
  const estiloBurbuja: React.CSSProperties = caja
    ? abajo
      ? { bottom: Math.max(alto - caja.top + 12, 12) }
      : { top: caja.top + caja.height + 12 }
    : { top: "50%", transform: "translateY(-50%)" };

  return (
    <div className="pointer-events-none fixed inset-0 z-50" data-testid={`recorrido-${recorrido.id}`}>
      {/* Fondo: si el paso espera un toque, deja tocar el elemento resaltado. */}
      {caja ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-tarjeta border-2 border-ambar transition-[top,left,width,height] duration-200"
          style={{ ...caja, boxShadow: "0 0 0 9999px rgba(15,30,46,0.6)" }}
        />
      ) : (
        <div aria-hidden className="pointer-events-auto fixed inset-0 bg-[#0f1e2e]/60" />
      )}
      {!paso.esperarToque && <div className="pointer-events-auto fixed inset-0" onClick={(e) => e.stopPropagation()} />}
      {paso.esperarToque && caja && (
        // Bloquea todo menos el recorte.
        <>
          <div className="pointer-events-auto fixed inset-x-0 top-0" style={{ height: Math.max(caja.top, 0) }} />
          <div className="pointer-events-auto fixed inset-x-0 bottom-0" style={{ top: caja.top + caja.height }} />
          <div className="pointer-events-auto fixed left-0" style={{ top: caja.top, height: caja.height, width: Math.max(caja.left, 0) }} />
          <div className="pointer-events-auto fixed right-0" style={{ top: caja.top, height: caja.height, left: caja.left + caja.width }} />
        </>
      )}

      <div
        ref={burbuja}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-titulo"
        aria-describedby="coach-texto"
        className="pointer-events-auto fixed inset-x-4 mx-auto max-w-sm rounded-tarjeta bg-superficie p-4 text-tinta shadow-xl outline-none motion-safe:animate-[aparecer_150ms_ease-out]"
        style={estiloBurbuja}
      >
        <p className="text-chico font-semibold text-tinta-suave">
          {i + 1} de {pasos.length}
        </p>
        <h2 id="coach-titulo" className="text-medio font-bold">
          {paso.titulo}
        </h2>
        <p id="coach-texto" className="mt-1">
          {paso.texto}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Boton variante="fantasma" onClick={alSaltar}>
            Saltar
          </Boton>
          {!paso.esperarToque && <Boton onClick={avanzar}>{i === pasos.length - 1 ? "Listo" : "Siguiente"}</Boton>}
        </div>
      </div>
    </div>
  );
}
