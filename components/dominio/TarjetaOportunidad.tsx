"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Trophy, X } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Estado } from "@/components/ui/Chip";
import { cx } from "@/components/ui/clases";
import { Dinero } from "@/components/ui/Dinero";
import { Hoja } from "@/components/ui/Hoja";
import { cambiarEtapa, marcarPerdida, programarSeguimiento } from "@/lib/acciones/ventas";
import { NOMBRE_ETAPA, abierta, esEtapa, siguienteEtapa } from "@/lib/dominio/etapas";
import { diaBogota, sumarDias, textoFecha } from "@/lib/dominio/semanas";
import type { Miembro, OportunidadFila } from "@/lib/datos";
import type { Plan } from "@/lib/datos-cobros";
import { AsistenteGanada } from "./AsistenteGanada";
import { BotonWhatsapp } from "./BotonWhatsapp";

type Props = {
  o: OportunidadFila;
  quien: string;
  /** El primero de la lista lleva los data-recorrido del product tour de Ventas. */
  primero?: boolean;
  mostrarCliente?: boolean;
  /** Solo gerente: habilita "Ganada" (asistente de cobro). */
  gerencia?: { planes: Plan[]; miembros: Miembro[] };
};

export function TarjetaOportunidad({ o, quien, primero, mostrarCliente = true, gerencia }: Props) {
  const avisar = useAvisar();
  const [pendiente, iniciar] = useTransition();
  const [perdiendo, setPerdiendo] = useState(false);
  const [programando, setProgramando] = useState(false);
  const [ganando, setGanando] = useState(false);
  const sig = siguienteEtapa(o.etapa);
  const estaAbierta = abierta(o.etapa);
  const fecha = o.proxima_fecha ? textoFecha(o.proxima_fecha) : null;
  const vendedores = o.vendedores.map((v) => v.nombre).join(", ");

  function pasar() {
    if (!sig) return;
    iniciar(async () => {
      const r = await cambiarEtapa(o.id, sig);
      avisar(r.ok ? `${o.cliente.nombre}: ${NOMBRE_ETAPA[sig]}` : r.error, r.ok ? "bien" : "error");
    });
  }

  return (
    <article
      className={cx("flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4", pendiente && "opacity-60")}
      data-testid="tarjeta-oportunidad"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {mostrarCliente && (
            <Link href={`/clientes/${o.cliente.id}`} className="block truncate text-medio font-bold hover:underline">
              {o.cliente.nombre}
            </Link>
          )}
          <p className="text-tinta-suave">
            {o.producto.nombre}
            {o.valor_estimado ? (
              <>
                {" · "}
                <Dinero pesos={o.valor_estimado} className="!text-base !font-semibold" />
              </>
            ) : null}
          </p>
        </div>
        {!estaAbierta && (
          <Estado estado={o.etapa === "ganada" ? "bien" : "neutro"}>{esEtapa(o.etapa) ? NOMBRE_ETAPA[o.etapa] : o.etapa}</Estado>
        )}
      </header>

      {estaAbierta && (
        <button
          type="button"
          onClick={() => setProgramando(true)}
          data-recorrido={primero ? "ventas-fecha" : undefined}
          className="flex min-h-11 items-center gap-2 rounded-control text-left hover:bg-suave"
        >
          <CalendarClock size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-tinta-suave" />
          {fecha ? (
            <span>
              <span className={cx("font-semibold", fecha.estado === "error" && "text-error", fecha.estado === "alerta" && "text-alerta")}>
                {fecha.texto}
              </span>
              {o.proxima_accion && <span className="text-tinta-suave"> · {o.proxima_accion}</span>}
            </span>
          ) : (
            <span className="font-semibold text-alerta">Sin próxima fecha · ponle una</span>
          )}
        </button>
      )}
      {o.etapa === "perdida" && o.motivo_perdida && <p className="text-tinta-suave">Motivo: {o.motivo_perdida}</p>}

      <p className="text-chico text-tinta-suave">
        {o.responsable ? `Lleva: ${o.responsable.nombre}` : "Sin responsable"}
        {vendedores && ` · Vendedores: ${vendedores}`}
      </p>

      {estaAbierta && (
        <div className="flex flex-wrap items-center gap-2">
          {sig && (
            <Boton
              variante="secundario"
              onClick={pasar}
              disabled={pendiente}
              data-recorrido={primero ? "ventas-pasar" : undefined}
              icono={<ArrowRight size={20} strokeWidth={1.75} aria-hidden />}
            >
              Pasar a {NOMBRE_ETAPA[sig]}
            </Boton>
          )}
          {gerencia && (
            <Boton
              variante="secundario"
              onClick={() => setGanando(true)}
              disabled={pendiente}
              icono={<Trophy size={20} strokeWidth={1.75} aria-hidden />}
            >
              Ganada
            </Boton>
          )}
          <Boton
            variante="fantasma"
            onClick={() => setPerdiendo(true)}
            disabled={pendiente}
            icono={<X size={20} strokeWidth={1.75} aria-hidden />}
          >
            Perdida
          </Boton>
          <div className="ml-auto">
            <BotonWhatsapp
              compacto
              whatsapp={o.cliente.whatsapp}
              contacto={o.cliente.contacto}
              negocio={o.cliente.nombre}
              producto={o.producto.nombre}
              quien={quien}
            />
          </div>
        </div>
      )}

      <HojaPerdida abierta={perdiendo} alCerrar={() => setPerdiendo(false)} o={o} />
      <HojaSeguimiento abierta={programando} alCerrar={() => setProgramando(false)} o={o} />
      {/* Solo existe mientras está abierto: no se dibuja un asistente escondido por cada tarjeta. */}
      {gerencia && estaAbierta && ganando && (
        <AsistenteGanada o={o} planes={gerencia.planes} miembros={gerencia.miembros} abierta alCerrar={() => setGanando(false)} />
      )}
    </article>
  );
}

function HojaPerdida({ abierta: a, alCerrar, o }: { abierta: boolean; alCerrar: () => void; o: OportunidadFila }) {
  const avisar = useAvisar();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  return (
    <Hoja abierta={a} alCerrar={alCerrar} titulo={`¿Por qué se perdió ${o.cliente.nombre}?`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            const r = await marcarPerdida(o.id, motivo);
            if (!r.ok) return setError(r.error);
            avisar("Marcada como perdida");
            alCerrar();
          });
        }}
      >
        <p className="text-tinta-suave">El motivo sirve para mejorar el guion cada domingo.</p>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Motivo</span>
          <textarea
            rows={3}
            required
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Le pareció caro / ya tiene otra solución / no contesta"
            aria-invalid={error ? true : undefined}
            className="rounded-control border border-borde bg-superficie px-4 py-3 placeholder:text-tinta-suave focus:outline-2 focus:outline-tinta"
          />
        </label>
        {error && (
          <p role="alert" className="font-semibold text-error">
            {error}
          </p>
        )}
        <Boton type="submit" ancho disabled={pendiente}>
          {pendiente ? "Guardando…" : "Marcar como perdida"}
        </Boton>
      </form>
    </Hoja>
  );
}

function HojaSeguimiento({ abierta: a, alCerrar, o }: { abierta: boolean; alCerrar: () => void; o: OportunidadFila }) {
  const avisar = useAvisar();
  const [accion, setAccion] = useState(o.proxima_accion ?? "");
  const [fecha, setFecha] = useState(o.proxima_fecha ?? "");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const hoy = diaBogota();
  return (
    <Hoja abierta={a} alCerrar={alCerrar} titulo={`Seguimiento · ${o.cliente.nombre}`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            const r = await programarSeguimiento(o.id, accion || null, fecha || null);
            if (!r.ok) return setError(r.error);
            avisar("Seguimiento guardado");
            alCerrar();
          });
        }}
      >
        <div className="flex flex-wrap gap-2">
          {[
            ["Mañana", sumarDias(hoy, 1)],
            ["En 3 días", sumarDias(hoy, 3)],
            ["En una semana", sumarDias(hoy, 7)],
          ].map(([t, f]) => (
            <Boton key={t} variante={fecha === f ? "principal" : "secundario"} onClick={() => setFecha(f!)}>
              {t}
            </Boton>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="min-h-12 rounded-control border border-borde bg-superficie px-4 focus:outline-2 focus:outline-tinta"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Qué vas a hacer</span>
          <input
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
            placeholder="Llevar la demo"
            className="min-h-12 rounded-control border border-borde bg-superficie px-4 placeholder:text-tinta-suave focus:outline-2 focus:outline-tinta"
          />
        </label>
        {error && (
          <p role="alert" className="font-semibold text-error">
            {error}
          </p>
        )}
        <Boton type="submit" ancho disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar"}
        </Boton>
      </form>
    </Hoja>
  );
}
