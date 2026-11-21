import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { misEmpresas, obtenerContexto } from "@/lib/sesion";
import { Empresas } from "./Empresas";

export const metadata: Metadata = { title: "Ajustes" };

export default async function Ajustes() {
  const [ctx, empresas] = await Promise.all([obtenerContexto(), misEmpresas()]);
  const esGerente = empresas.some((e) => e.rol === "gerente");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-titulo text-grande leading-tight">Ajustes</h1>

      {ctx && (empresas.length > 1 || esGerente) && (
        <section className="flex flex-col gap-3" aria-labelledby="empresas-titulo">
          <h2 id="empresas-titulo" className="text-medio font-bold">
            Tus empresas
          </h2>
          <Empresas empresas={empresas} actual={ctx.empresa.id} />
          {esGerente && (
            <Link href="/registro" className="inline-flex min-h-12 items-center gap-2 self-start font-semibold underline underline-offset-4">
              <Plus size={20} strokeWidth={1.75} aria-hidden /> Crear otra empresa
            </Link>
          )}
        </section>
      )}

      <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
        <li>
          <Link href="/ajustes/acerca" className="flex min-h-14 items-center justify-between px-4 font-semibold hover:bg-suave">
            Acerca de
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
          </Link>
        </li>
        <li>
          <Link href="/componentes" className="flex min-h-14 items-center justify-between px-4 font-semibold hover:bg-suave">
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
