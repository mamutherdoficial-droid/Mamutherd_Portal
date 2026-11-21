import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { Dinero } from "@/components/ui/Dinero";
import { cobrosLista, hayMensualidades } from "@/lib/datos-cobros";
import { inicioMes } from "@/lib/dominio/cobros";
import { diaBogota } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { Conciliar } from "@/components/dominio/Conciliar";
import { datosConciliar } from "@/lib/conciliar";
import { CobrosLista } from "./CobrosLista";
import { GenerarMensualidades } from "./GenerarMensualidades";

export const metadata: Metadata = { title: "Cobros" };

export default async function Cobros() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  // Una ayudante nunca ve cobros (RLS ya no se los da; aquí ni siquiera entra).
  if (ctx.rol !== "gerente") redirect("/hoy");

  const hoy = diaBogota();
  const mes = inicioMes(hoy);
  const [cobros, yaGeneradas, conciliar] = await Promise.all([
    cobrosLista(ctx.empresa.id),
    hayMensualidades(ctx.empresa.id, mes),
    datosConciliar(ctx.empresa.id),
  ]);
  const porCobrar = cobros.filter((c) => c.estado !== "pagado").reduce((s, c) => s + c.saldo, 0);
  const vencido = cobros.filter((c) => c.estado === "vencido").reduce((s, c) => s + c.saldo, 0);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-grande leading-tight">Cobros</h1>
          <p className="text-tinta-suave">
            Por cobrar <Dinero pesos={porCobrar} className="!text-base" />
            {vencido > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-error">
                  vencido <Dinero pesos={vencido} className="!text-base" />
                </span>
              </>
            )}
          </p>
        </div>
        <GenerarMensualidades mes={mes} yaGeneradas={yaGeneradas} />
      </header>
      {/* Celular: conciliar en su pantalla. PC: al lado de la tabla. */}
      <Link
        href="/cobros/conciliar"
        className="flex min-h-12 items-center justify-between gap-2 rounded-tarjeta border border-borde bg-superficie px-4 font-semibold lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <Landmark size={20} strokeWidth={1.75} aria-hidden /> Conciliar con el banco
        </span>
        {conciliar.revisiones.length > 0 && (
          <span className="numeros rounded-full bg-ambar px-2 text-chico text-sobre-ambar">{conciliar.revisiones.length}</span>
        )}
      </Link>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <CobrosLista cobros={cobros} quien={ctx.nombre.split(" ")[0]!} hoy={hoy} />
        <aside className="hidden lg:block">
          <Conciliar revisiones={conciliar.revisiones} pendientes={conciliar.pendientes} />
        </aside>
      </div>
      <OfrecerRecorrido id="cobros" />
    </div>
  );
}
