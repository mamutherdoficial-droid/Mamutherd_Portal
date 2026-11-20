import type { ComponentProps, ReactNode } from "react";
import { cx } from "./clases";

type Props = { titulo?: string; accion?: ReactNode } & ComponentProps<"section">;

export function Tarjeta({ titulo, accion, className, children, ...resto }: Props) {
  return (
    <section className={cx("rounded-tarjeta border border-borde bg-superficie p-4", className)} {...resto}>
      {(titulo || accion) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-medio font-bold">{titulo}</h2>}
          {accion}
        </header>
      )}
      {children}
    </section>
  );
}
