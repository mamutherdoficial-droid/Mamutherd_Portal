import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { Dinero } from "@/components/ui/Dinero";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { alertasComisiones, comisionesDe, miembroPorId, trabajosPorPagar } from "@/lib/datos-cobros";
import { NOMBRE_CONCEPTO } from "@/lib/dominio/cobros";
import { diaBogota, fechaLarga } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";
import { AlertasDescontar, PagarAyudante } from "./PagarAyudante";

export const metadata: Metadata = { title: "Persona del equipo" };

export default async function PersonaEquipo({ params }: PageProps<"/equipo/[id]">) {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  if (ctx.rol !== "gerente") redirect("/mis-comisiones");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const persona = await miembroPorId(ctx.empresa.id, id);
  if (!persona) notFound();
  const [comisiones, trabajos, alertas] = await Promise.all([
    comisionesDe(ctx.empresa.id, id),
    trabajosPorPagar(ctx.empresa.id, id),
    alertasComisiones(ctx.empresa.id, id),
  ]);
  const pendientes = comisiones.filter((k) => k.estado === "pendiente");
  const pagadas = comisiones.filter((k) => k.estado === "pagada");
  const totalPendiente = pendientes.reduce((s, k) => s + k.valor, 0) + trabajos.reduce((s, t) => s + t.valor, 0);
  const totalPagado = pagadas.reduce((s, k) => s + k.valor, 0);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/equipo" className="inline-flex min-h-11 items-center gap-1 self-start font-semibold text-tinta-suave">
        <ArrowLeft size={20} strokeWidth={1.75} aria-hidden /> Equipo
      </Link>
      <header>
        <h1 className="font-titulo text-grande leading-tight">{persona.nombre}</h1>
        <p className="text-tinta-suave">{persona.rol === "gerente" ? "Gerente" : "Ayudante"}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tarjeta titulo="Le debemos">
          <Dinero pesos={totalPendiente} tamano="grande" />
        </Tarjeta>
        <Tarjeta titulo="Ya le pagamos">
          <Dinero pesos={totalPagado} tamano="grande" />
        </Tarjeta>
      </div>

      {alertas.length > 0 && <AlertasDescontar alertas={alertas} />}

      <Tarjeta titulo="Por pagar">
        {pendientes.length + trabajos.length === 0 ? (
          <p className="text-tinta-suave">Nada pendiente.</p>
        ) : (
          <PagarAyudante
            miembroId={persona.id}
            hoy={diaBogota()}
            comisiones={pendientes.map((k) => ({
              id: k.id,
              valor: k.valor,
              texto: `${k.negocio} · ${NOMBRE_CONCEPTO[k.concepto] ?? k.concepto} (${k.atribucion})`,
            }))}
            trabajos={trabajos.map((t) => ({ id: t.id, valor: t.valor, texto: t.titulo }))}
          />
        )}
      </Tarjeta>

      <Tarjeta titulo="Pagadas">
        {pagadas.length === 0 ? (
          <p className="text-tinta-suave">Todavía ninguna.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borde">
            {pagadas.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">
                    {k.negocio} · {NOMBRE_CONCEPTO[k.concepto] ?? k.concepto}
                  </p>
                  <p className="text-chico text-tinta-suave">
                    {k.pagada_en ? `Pagada el ${fechaLarga(k.pagada_en).toLowerCase()}` : "Pagada"}
                    {k.medio_pago && ` · ${k.medio_pago}`}
                  </p>
                </div>
                <Dinero pesos={k.valor} className="!text-base" />
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
