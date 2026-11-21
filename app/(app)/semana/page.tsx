import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { AvanceMeta } from "@/components/dominio/AvanceMeta";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { Dinero } from "@/components/ui/Dinero";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { resumenSemana } from "@/lib/datos-fase4";
import { diaBogota, fechaLarga, inicioSemana, sumarDias } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";

export const metadata: Metadata = { title: "Resumen de la semana" };

/** Revisión del domingo (plan de ventas): una sola consulta a resumen_semana. */
export default async function Semana({ searchParams }: PageProps<"/semana">) {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  if (ctx.rol !== "gerente") redirect("/hoy");
  const { lunes: pedido } = await searchParams;
  const hoy = diaBogota();
  const actual = inicioSemana(hoy);
  const lunes = typeof pedido === "string" && /^\d{4}-\d{2}-\d{2}$/.test(pedido) ? inicioSemana(pedido) : actual;
  const r = await resumenSemana(ctx.empresa.id, lunes);
  const meta = (i: string) => r.metas.find((m) => m.indicador === i && !m.miembro && !m.producto);

  const cifras = [
    { titulo: "Visitas", valor: r.visitas, meta: meta("visitas") },
    { titulo: "Con el dueño", valor: r.duenos, meta: meta("conversaciones_dueno") },
    { titulo: "Clientes nuevos", valor: r.clientes_nuevos, meta: meta("clientes_nuevos") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titulo text-grande leading-tight">Resumen de la semana</h1>
          <p className="text-tinta-suave">
            Del {fechaLarga(lunes).toLowerCase()} al {fechaLarga(sumarDias(lunes, 6)).toLowerCase()}
          </p>
        </div>
        <nav aria-label="Otra semana" className="flex gap-2">
          <Link href={`/semana?lunes=${sumarDias(lunes, -7)}`} className="inline-flex min-h-12 items-center gap-1 rounded-control border border-borde px-3 font-semibold hover:bg-suave">
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden /> Anterior
          </Link>
          {lunes < actual && (
            <Link href={`/semana?lunes=${sumarDias(lunes, 7)}`} className="inline-flex min-h-12 items-center gap-1 rounded-control border border-borde px-3 font-semibold hover:bg-suave">
              Siguiente <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
            </Link>
          )}
        </nav>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" data-recorrido="semana-cifras" data-testid="semana-cifras">
        {cifras.map((c) => (
          <div key={c.titulo} className="rounded-tarjeta border border-borde bg-superficie p-4">
            <p className="text-chico font-semibold text-tinta-suave">{c.titulo}</p>
            <p className="numeros text-grande font-bold">
              {c.valor}
              {c.meta && <span className="text-medio font-normal text-tinta-suave"> / {c.meta.objetivo}</span>}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Plata">
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between gap-3">
              <dt>Entró esta semana</dt>
              <dd><Dinero pesos={r.ingresos} className="!text-base" /></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Cobros vencidos ({r.vencidos.cantidad})</dt>
              <dd className={r.vencidos.saldo > 0 ? "text-error" : ""}><Dinero pesos={r.vencidos.saldo} className="!text-base" /></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Por pagar al equipo</dt>
              <dd><Dinero pesos={r.por_pagar_equipo} className="!text-base" /></dd>
            </div>
          </dl>
        </Tarjeta>

        <Tarjeta titulo="Objeciones más repetidas" data-recorrido="semana-objeciones">
          <p className="mb-2 text-chico text-tinta-suave">Motivos de las ventas perdidas (últimas 4 semanas). Úsalos para ajustar el guion.</p>
          {r.objeciones.length === 0 ? (
            <p className="text-tinta-suave">Ninguna venta perdida. 💪</p>
          ) : (
            <ol className="flex flex-col gap-1" data-testid="objeciones">
              {r.objeciones.map((o) => (
                <li key={o.motivo} className="flex justify-between gap-3">
                  <span className="first-letter:uppercase">{o.motivo}</span>
                  <span className="numeros font-bold">{o.veces}×</span>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>

        <Tarjeta titulo="Metas">
          {r.metas.length === 0 ? (
            <p className="text-tinta-suave">
              Sin metas esa semana. <Link href="/metas" className="font-semibold underline">Ponlas aquí</Link>.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {r.metas.map((m, i) => (
                <AvanceMeta key={i} indicador={m.indicador} objetivo={m.objetivo} logrado={m.logrado} quien={m.miembro ?? m.producto} />
              ))}
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Inventario">
          {r.stock_bajo.length === 0 ? (
            <p className="text-tinta-suave">Todo con stock suficiente.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {r.stock_bajo.map((s) => (
                <li key={s.nombre} className="flex justify-between gap-3 font-semibold text-alerta">
                  <span>{s.nombre}</span>
                  <span className="numeros">
                    {s.stock} (mín. {s.minimo})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
      <p className="text-chico text-tinta-suave">Perdidas esta semana: {r.perdidas}.</p>
      <OfrecerRecorrido id="semana" />
    </div>
  );
}
