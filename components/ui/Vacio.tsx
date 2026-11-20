import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = { icono: LucideIcon; titulo: string; texto?: string; accion?: ReactNode };

/** Estado vacío útil: dice qué pasa y qué hacer. */
export function Vacio({ icono: Icono, titulo, texto, accion }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-tarjeta border border-dashed border-borde px-6 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-suave">
        <Icono size={20} strokeWidth={1.75} aria-hidden />
      </span>
      <p className="font-bold">{titulo}</p>
      {texto && <p className="max-w-xs text-tinta-suave">{texto}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
