import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { Dinero } from "@/components/ui/Dinero";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { alertasComisiones, comisionesDe, trabajosPorPagar } from "@/lib/datos-cobros";
import { NOMBRE_CONCEPTO } from "@/lib/dominio/cobros";
import { diaBogota, fechaLarga } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";
import { AlertasDescontar, PagarAyudante } from "./PagarAyudante";
import { Invitar } from "./Invitar";
import { ListaTareas } from "@/app/(app)/tareas/ListaTareas";
import { persona as leerPersona, reglasComision, tareas as leerTareas } from "@/lib/datos-equipo";

export const metadata: Metadata = { title: "Persona del equipo" };

export default async function PersonaEquipo({ params }: PageProps<"/equipo/[id]">) {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  if (ctx.rol !== "gerente") redirect("/hoy");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const persona = await leerPersona(ctx.empresa.id, id);
  if (!persona) notFound();
  const [comisiones, trabajos, alertas, reglas, susTareas] = await Promise.all([
    comisionesDe(ctx.empresa.id, id),
    trabajosPorPagar(ctx.empresa.id, id),
    alertasComisiones(ctx.empresa.id, id),
    reglasComision(ctx.empresa.id),
    leerTareas(ctx.empresa.id, id),
  ]);
  const FORMA: Record<string, string> = { comision: "Comisión", por_trabajo: "Por trabajo", fijo: "Fijo", ninguno: "Sin pago" };
  const ATRIB: Record<string, string> = { propia: "Venta propia", conjunta: "Venta conjunta", referido: "Referido" };
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
        <p className="text-tinta-suave">
          {persona.rol === "gerente" ? "Gerente" : "Ayudante"} · {FORMA[persona.forma_pago] ?? persona.forma_pago}
          {persona.correo && ` · ${persona.correo}`}
        </p>
      </header>

      {!persona.con_acceso && (
        <Tarjeta titulo="Acceso al portal">
          <Invitar
            miembroId={persona.id}
            nombre={persona.nombre}
            whatsapp={persona.whatsapp}
            empresa={ctx.empresa.nombre}
            quien={ctx.nombre.split(" ")[0]!}
            hayVigente={persona.invitacion_viva}
          />
        </Tarjeta>
      )}

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

      <Tarjeta titulo="Sus tareas">
        <ListaTareas tareas={susTareas} esGerente mostrarPersona={false} />
      </Tarjeta>

      {persona.rol === "ayudante" && (
        <Tarjeta titulo="Acuerdos" data-testid="acuerdos">
          <p className="mb-2">
            Forma de pago: <strong>{FORMA[persona.forma_pago] ?? persona.forma_pago}</strong>
          </p>
          {persona.forma_pago === "comision" && (
            <ul className="flex flex-col gap-1">
              {reglas.map((r) => (
                <li key={`${r.atribucion}-${r.concepto}`}>
                  {ATRIB[r.atribucion] ?? r.atribucion}: <strong className="numeros">{r.porcentaje}%</strong> de la{" "}
                  {NOMBRE_CONCEPTO[r.concepto]?.toLowerCase() ?? r.concepto}
                  {r.meses_max && ` × ${r.meses_max} meses`}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-chico text-tinta-suave">La comisión se crea cuando el negocio paga, no antes.</p>
        </Tarjeta>
      )}

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
