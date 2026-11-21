import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { Conciliar } from "@/components/dominio/Conciliar";
import { datosConciliar } from "@/lib/conciliar";
import { obtenerContexto } from "@/lib/sesion";

export const metadata: Metadata = { title: "Conciliar con el banco" };

/** En el celular, el panel de conciliar va en su propia pantalla (en PC está al lado de la tabla). */
export default async function ConciliarPagina() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  if (ctx.rol !== "gerente") redirect("/hoy");
  const { revisiones, pendientes } = await datosConciliar(ctx.empresa.id);
  return (
    <div className="flex flex-col gap-5">
      <Link href="/cobros" className="inline-flex min-h-11 items-center gap-1 self-start font-semibold text-tinta-suave">
        <ArrowLeft size={20} strokeWidth={1.75} aria-hidden /> Cobros
      </Link>
      <Conciliar revisiones={revisiones} pendientes={pendientes} />
    </div>
  );
}
