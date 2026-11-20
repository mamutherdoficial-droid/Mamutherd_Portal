"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Boxes,
  Coins,
  Handshake,
  ListChecks,
  Menu,
  Settings,
  Store,
  Sun,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/components/ui/clases";
import { disponible, type Seccion } from "@/lib/navegacion";

const ICONOS: Record<Seccion["icono"], LucideIcon> = {
  hoy: Sun,
  ventas: Handshake,
  clientes: Store,
  cobros: Wallet,
  comisiones: Coins,
  equipo: Users,
  tareas: ListChecks,
  inventario: Boxes,
  metas: Target,
  ajustes: Settings,
  guia: BookOpen,
  mas: Menu,
};

function activa(ruta: string, actual: string) {
  return actual === ruta || actual.startsWith(`${ruta}/`);
}

/** Menú lateral del PC (desde 1024 px). */
export function MenuLateral({ secciones }: { secciones: Seccion[] }) {
  const actual = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {secciones.map((s) => {
        const Icono = ICONOS[s.icono];
        const contenido = (
          <>
            <Icono size={20} strokeWidth={1.75} aria-hidden />
            <span className="flex-1">{s.etiqueta}</span>
            {!disponible(s) && <span className="text-chico font-medium text-tinta-suave">Pronto</span>}
          </>
        );
        return (
          <li key={s.ruta}>
            {disponible(s) ? (
              <Link
                href={s.ruta}
                aria-current={activa(s.ruta, actual) ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-control px-3 font-semibold",
                  activa(s.ruta, actual) ? "bg-suave text-tinta" : "text-tinta-suave hover:bg-suave hover:text-tinta",
                )}
              >
                {contenido}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="flex min-h-11 items-center gap-3 rounded-control px-3 font-semibold text-tinta-suave opacity-60"
              >
                {contenido}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Barra inferior del celular: 4 accesos, botones de 56 px de alto. */
export function BarraInferior({ secciones }: { secciones: Seccion[] }) {
  const actual = usePathname();
  return (
    <ul className="grid grid-cols-4">
      {secciones.map((s) => {
        const Icono = ICONOS[s.icono];
        const esta = activa(s.ruta, actual);
        const clases = cx(
          "flex min-h-14 flex-col items-center justify-center gap-0.5 text-chico font-semibold",
          esta ? "text-tinta" : "text-tinta-suave",
          !disponible(s) && "opacity-50",
        );
        const contenido = (
          <>
            <span className={cx("grid h-7 w-12 place-items-center rounded-full", esta && "bg-suave")}>
              <Icono size={20} strokeWidth={1.75} aria-hidden />
            </span>
            {s.etiqueta}
          </>
        );
        return (
          <li key={s.ruta}>
            {disponible(s) ? (
              <Link href={s.ruta} aria-current={esta ? "page" : undefined} className={clases}>
                {contenido}
              </Link>
            ) : (
              <span aria-disabled="true" title="Llega pronto" className={clases}>
                {contenido}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
