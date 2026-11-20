import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Ajustes" };

export default function Ajustes() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-titulo text-grande leading-tight">Ajustes</h1>
      <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
        <li>
          <Link
            href="/ajustes/acerca"
            className="flex min-h-14 items-center justify-between px-4 font-semibold hover:bg-suave"
          >
            Acerca de
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
          </Link>
        </li>
        <li>
          <Link
            href="/componentes"
            className="flex min-h-14 items-center justify-between px-4 font-semibold hover:bg-suave"
          >
            Componentes (para revisar el diseño)
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
          </Link>
        </li>
        <li className="flex min-h-14 items-center justify-between px-4 font-semibold text-tinta-suave">
          Productos, planes y comisiones
          <span className="text-chico font-medium">Pronto</span>
        </li>
      </ul>
    </div>
  );
}
