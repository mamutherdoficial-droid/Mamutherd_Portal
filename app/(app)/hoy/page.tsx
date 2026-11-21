import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CalendarDays, CircleAlert, ListChecks, Target } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { AnotarVisita } from "@/components/dominio/AnotarVisita";
import { AvanceMeta } from "@/components/dominio/AvanceMeta";
import { BotonWhatsapp } from "@/components/dominio/BotonWhatsapp";
import { cx } from "@/components/ui/clases";
import { Dinero } from "@/components/ui/Dinero";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Vacio } from "@/components/ui/Vacio";
import { clientesCortos, productosActivos, seguimientosHasta, visitasDesde, type OportunidadFila } from "@/lib/datos";
import { tareas as leerTareas } from "@/lib/datos-equipo";
import { metasEntre, tableroGerente } from "@/lib/datos-fase4";
import { diaBogota, fechaLarga, inicioSemana, sumarDias, textoFecha } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";

export const metadata: Metadata = { title: "Hoy" };

// Hoy completo (Fase 4): seguimientos, metas de la semana, tareas y, para el gerente, plata y stock.
export default async function Hoy() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  const esGerente = ctx.rol === "gerente";

  const hoy = diaBogota();
  const lunes = inicioSemana(hoy);
  const [seguimientos, clientes, productos, semana, metas, misTareas, tablero] = await Promise.all([
    seguimientosHasta(ctx.empresa.id, sumarDias(hoy, 7)),
    clientesCortos(ctx.empresa.id),
    productosActivos(ctx.empresa.id),
    visitasDesde(ctx.empresa.id, lunes),
    metasEntre(ctx.empresa.id, lunes, lunes),
    leerTareas(ctx.empresa.id, ctx.miembroId),
    esGerente ? tableroGerente(ctx.empresa.id) : Promise.resolve(null),
  ]);

  const vencidos = seguimientos.filter((s) => s.proxima_fecha! < hoy);
  const deHoy = seguimientos.filter((s) => s.proxima_fecha === hoy);
  const proximos = seguimientos.filter((s) => s.proxima_fecha! > hoy);
  const nombre = ctx.nombre.split(" ")[0]!;
  // Gerente: metas de la empresa. Ayudante: las suyas primero, luego las de la empresa (RLS ya filtra).
  const misMetas = esGerente
    ? metas.filter((m) => !m.miembro_id && !m.producto)
    : [...metas.filter((m) => m.miembro_id === ctx.miembroId), ...metas.filter((m) => !m.miembro_id && !m.producto)];
  const tareasPendientes = misTareas.filter((t) => t.estado === "pendiente").slice(0, 5);

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
        {/* Columna 1: a quién llamar */}
        <div className="flex flex-col gap-4">
          <Tarjeta titulo="Para hoy" data-testid="seguimientos-hoy">
            {vencidos.length + deHoy.length === 0 ? (
              <Vacio icono={CalendarClock} titulo="Nada pendiente para hoy" texto="Cuando anotes visitas con fecha, aquí ves a quién volver a llamar." />
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

        {/* Columna 2: cómo vamos */}
        <div className="flex flex-col gap-4">
          <Tarjeta
            titulo="Meta de la semana"
            data-testid="hoy-metas"
            accion={
              <Link href="/metas" className="text-chico font-semibold underline underline-offset-4">
                Ver metas
              </Link>
            }
          >
            {misMetas.length === 0 ? (
              <Vacio icono={Target} titulo="Sin metas esta semana" texto={esGerente ? "Ponlas en Metas." : undefined} />
            ) : (
              <div className="flex flex-col gap-4">
                {misMetas.map((m) => (
                  <AvanceMeta key={m.id} indicador={m.indicador} objetivo={m.objetivo} logrado={m.logrado} quien={m.miembro_id ? "tuya" : null} />
                ))}
              </div>
            )}
          </Tarjeta>

          {tablero && (
            <Tarjeta titulo="Plata" data-testid="hoy-plata">
              <dl className="flex flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <dt>
                    <Link href="/cobros" className="underline underline-offset-4">Por cobrar</Link>
                  </dt>
                  <dd><Dinero pesos={tablero.porCobrar} className="!text-base" /></dd>
                </div>
                {tablero.vencido > 0 && (
                  <div className="flex justify-between gap-3 font-semibold text-error">
                    <dt>Vencido</dt>
                    <dd><Dinero pesos={tablero.vencido} className="!text-base" /></dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt>
                    <Link href="/equipo" className="underline underline-offset-4">Por pagar al equipo</Link>
                  </dt>
                  <dd><Dinero pesos={tablero.porPagarEquipo} className="!text-base" /></dd>
                </div>
              </dl>
              {tablero.stockBajo.length > 0 && (
                <p className="mt-3 border-t border-borde pt-3 font-semibold text-alerta">
                  <Link href="/inventario" className="underline underline-offset-4">Stock bajo</Link>:{" "}
                  {tablero.stockBajo.map((s) => `${s.nombre} (${s.stock})`).join(", ")}
                </p>
              )}
            </Tarjeta>
          )}

          <Tarjeta
            titulo="Mis tareas"
            accion={
              <Link href="/tareas" className="text-chico font-semibold underline underline-offset-4">
                Ver todas
              </Link>
            }
          >
            {tareasPendientes.length === 0 ? (
              <Vacio icono={ListChecks} titulo="Sin tareas pendientes" />
            ) : (
              <ul className="flex flex-col divide-y divide-borde">
                {tareasPendientes.map((t) => {
                  const f = t.vence ? textoFecha(t.vence, hoy) : null;
                  return (
                    <li key={t.id} className="py-2">
                      <p className="font-semibold">{t.titulo}</p>
                      {f && (
                        <p className={cx("text-chico", f.estado === "error" ? "font-semibold text-error" : "text-tinta-suave")}>
                          {f.texto.replace("Vencida", "Venció")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Tarjeta>

          {esGerente && (
            <Link href="/semana" className="self-start font-semibold underline underline-offset-4">
              Resumen de la semana →
            </Link>
          )}
        </div>
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
          <span className={cx("font-semibold", f.estado === "error" && "text-error", f.estado === "alerta" && "text-alerta")}>{f.texto}</span>
          {" · "}
          {s.producto.nombre}
          {s.proxima_accion && ` · ${s.proxima_accion}`}
        </p>
      </Link>
      <BotonWhatsapp compacto whatsapp={s.cliente.whatsapp} contacto={s.cliente.contacto} negocio={s.cliente.nombre} producto={s.producto.nombre} quien={quien} />
    </li>
  );
}
