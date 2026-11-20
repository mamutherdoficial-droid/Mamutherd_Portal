"use client";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  abierta: boolean;
  alCerrar: () => void;
  titulo: string;
  children: ReactNode;
};

/**
 * Hoja inferior en el celular; panel lateral desde 1024 px (DESIGN.md → Navegación).
 * Usa <dialog> nativo: atrapa el foco, Esc cierra y el lector de pantalla la anuncia.
 */
export function Hoja({ abierta, alCerrar, titulo, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onClose={alCerrar}
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar(); // tocar el fondo cierra
      }}
      className={
        "m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-tarjeta bg-superficie p-0 text-tinta " +
        "backdrop:bg-[#0f1e2e]/60 open:animate-[entrar-desde-abajo_200ms_ease-out] " +
        "lg:ml-auto lg:mt-0 lg:h-dvh lg:max-h-none lg:w-[420px] lg:rounded-none lg:rounded-l-tarjeta"
      }
    >
      <div className="flex items-center justify-between gap-4 border-b border-borde px-5 py-3">
        <h2 className="text-medio font-bold">{titulo}</h2>
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar"
          className="grid size-12 place-items-center rounded-control hover:bg-suave"
        >
          <X size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <div className="overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
