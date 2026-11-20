import type { ComponentProps } from "react";
import { cx } from "./clases";

type Props = { seleccionado?: boolean } & ComponentProps<"button">;

/** Chip para elegir una opción (producto, resultado, filtro). */
export function Chip({ seleccionado, className, children, type = "button", ...resto }: Props) {
  return (
    <button
      type={type}
      aria-pressed={seleccionado}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 font-semibold",
        "transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta",
        seleccionado
          ? "border-principal bg-principal text-sobre-principal"
          : "border-borde bg-superficie text-tinta hover:bg-suave",
        className,
      )}
      {...resto}
    >
      {children}
    </button>
  );
}

type Estado = "bien" | "alerta" | "error" | "neutro";

const colores: Record<Estado, string> = {
  bien: "text-bien border-bien/40",
  alerta: "text-alerta border-alerta/40",
  error: "text-error border-error/40",
  neutro: "text-tinta-suave border-borde",
};

/** Etiqueta de estado (pagado, por vencer, vencido). No usa el ámbar. */
export function Estado({ estado = "neutro", children }: { estado?: Estado; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-chico font-semibold",
        colores[estado],
      )}
    >
      {children}
    </span>
  );
}
