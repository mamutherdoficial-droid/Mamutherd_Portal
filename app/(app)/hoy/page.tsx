import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CalendarDays, CircleAlert } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { AnotarVisita } from "@/components/dominio/AnotarVisita";
import { BotonWhatsapp } from "@/components/dominio/BotonWhatsapp";
import { cx } from "@/components/ui/clases";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Vacio } from "@/components/ui/Vacio";
import { clientesCortos, productosActivos, seguimientosHasta, visitasDesde, type OportunidadFila } from "@/lib/datos";
import { diaBogota, fechaLarga, inicioSemana, sumarDias, textoFecha } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";

export const metadata: Metadata = { title: "Hoy" };

// Fase 1: seguimientos vencidos, de hoy y de los próximos 7 días + "Anotar visita".
// Metas, tareas y totales llegan con "Hoy completo" en la fase 4.
export default async function Hoy() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;

  const hoy = diaBogota();
  const [seguimientos, clientes, productos, semana] = await Promise.all([
    seguimientosHasta(ctx.empresa.id, sumarDias(hoy, 7)),
    clientesCortos(ctx.empresa.id),
    productosActivos(ctx.empresa.id),
    visitasDesde(ctx.empresa.id, inicioSemana(hoy)),
  ]);

  const vencidos = seguimientos.filter((s) => s.proxima_fecha! < hoy);
  const deHoy = seguimientos.filter((s) => s.proxima_fecha === hoy);
  const proximos = seguimientos.filter((s) => s.proxima_fecha! > hoy);
  const nombre = ctx.nombre.split(" ")[0]!;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-tinta-suave">{fechaLarga(hoy)}</p>
        <h1 className="font-titulo text-grande leading-tight">Hola, {nombre}</h1>
        <p className="mt-1 text-medio" data-testid="visitas-semana">
          {semana.visitas === 0 ? (
            "Aún no hay visitas esta semana. La primera es la más difícil."
          ) : (
            <>
              Vas <strong className="numeros">{semana.visitas}</strong> {semana.visitas === 1 ? "visita" : "visitas"} esta
              semana, <strong className="numeros">{semana.duenos}</strong> con el dueño.
            </>
          )}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Para hoy" className="lg:row-span-2" data-testid="seguimientos-hoy">
          {vencidos.length + deHoy.length === 0 ? (
            <Vacio
              icono={CalendarClock}
              titulo="Nada pendiente para hoy"
              texto="Cuando anotes visitas con fecha, aquí ves a quién volver a llamar."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-borde">
              {vencidos.length > 0 && (
                <li className="flex items-center gap-2 pb-2 text-chico font-bold text-error">
                  <CircleAlert size={16} strokeWidth={1.75} aria-hidden />
                  {vencidos.length} {vencidos.length === 1 ? "vencido" : "vencidos"}
                </li>
              )}
              {[...vencidos, ...deHoy].map((s) => (
                <FilaSeguimiento key={s.id} s={s} quien={nombre} hoy={hoy} />
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta titulo="Próximos 7 días" data-testid="seguimientos-proximos">
          {proximos.length === 0 ? (
            <Vacio icono={CalendarDays} titulo="Sin seguimientos esta semana" />
          ) : (
            <ul className="flex flex-col divide-y divide-borde">
              {proximos.map((s) => (
                <FilaSeguimiento key={s.id} s={s} quien={nombre} hoy={hoy} />
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <AnotarVisita clientes={clientes} productos={productos} />
    </div>
  );
}

function FilaSeguimiento({ s, quien, hoy }: { s: OportunidadFila; quien: string; hoy: string }) {
  const f = textoFecha(s.proxima_fecha!, hoy);
  return (
    <li className="flex items-center gap-3 py-3" data-testid="fila-seguimiento">
      <Link href={`/clientes/${s.cliente.id}`} className="min-w-0 flex-1">
        <p className="truncate font-bold">{s.cliente.nombre}</p>
        <p className="truncate text-tinta-suave">
          <span className={cx("font-semibold", f.estado === "error" && "text-error", f.estado === "alerta" && "text-alerta")}>
            {f.texto}
          </span>
          {" · "}
          {s.producto.nombre}
          {s.proxima_accion && ` · ${s.proxima_accion}`}
        </p>
      </Link>
      <BotonWhatsapp
        compacto
        whatsapp={s.cliente.whatsapp}
        contacto={s.cliente.contacto}
        negocio={s.cliente.nombre}
        producto={s.producto.nombre}
        quien={quien}
      />
    </li>
  );
}
