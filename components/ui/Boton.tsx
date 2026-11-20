import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./clases";

type Variante = "principal" | "secundario" | "ambar" | "fantasma" | "peligro";

const estilos: Record<Variante, string> = {
  principal: "bg-principal text-sobre-principal hover:opacity-90",
  secundario: "bg-superficie text-tinta border border-borde hover:bg-suave",
  // El ámbar es para UNA cosa por pantalla (DESIGN.md): "Anotar visita".
  ambar: "bg-ambar text-sobre-ambar hover:opacity-90",
  fantasma: "bg-transparent text-tinta hover:bg-suave",
  peligro: "bg-transparent text-error border border-error/40 hover:bg-error/10",
};

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-5 font-semibold " +
  "transition-[opacity,transform] duration-150 active:scale-[0.98] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta " +
  "disabled:cursor-not-allowed disabled:opacity-50";

type Comunes = { variante?: Variante; ancho?: boolean; icono?: ReactNode };

export function Boton({
  variante = "principal",
  ancho,
  icono,
  className,
  children,
  type = "button",
  ...resto
}: Comunes & ComponentProps<"button">) {
  return (
    <button type={type} className={cx(base, estilos[variante], ancho && "w-full", className)} {...resto}>
      {icono}
      {children}
    </button>
  );
}

export function BotonEnlace({
  variante = "principal",
  ancho,
  icono,
  className,
  children,
  ...resto
}: Comunes & ComponentProps<typeof Link>) {
  return (
    <Link className={cx(base, estilos[variante], ancho && "w-full", className)} {...resto}>
      {icono}
      {children}
    </Link>
  );
}
