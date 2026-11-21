"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Ban, Receipt, Wallet } from "lucide-react";
import { BotonWhatsapp } from "@/components/dominio/BotonWhatsapp";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Chip, Estado } from "@/components/ui/Chip";
import { cx } from "@/components/ui/clases";
import { Dinero } from "@/components/ui/Dinero";
import { Hoja } from "@/components/ui/Hoja";
import { Vacio } from "@/components/ui/Vacio";
import { anularPago, registrarPago } from "@/lib/acciones/cobros";
import type { CobroFila } from "@/lib/datos-cobros";
import { MEDIOS_PAGO, NOMBRE_CONCEPTO, pestanaDe, type MedioPago } from "@/lib/dominio/cobros";
import { formatearPesos, leerPesos } from "@/lib/dominio/dinero";
import { fechaLarga, textoFecha } from "@/lib/dominio/semanas";
import { mensajeCobro } from "@/lib/dominio/whatsapp";

const PESTANAS = [
  { id: "por-cobrar", titulo: "Por cobrar" },
  { id: "vencidos", titulo: "Vencidos" },
  { id: "pagados", titulo: "Pagados" },
] as const;
type Pestana = (typeof PESTANAS)[number]["id"];

const ESTADO_VISUAL = { pendiente: "neutro", parcial: "alerta", pagado: "bien", vencido: "error", anulado: "neutro" } as const;
const NOMBRE_ESTADO = { pendiente: "Pendiente", parcial: "Parcial", pagado: "Pagado", vencido: "Vencido", anulado: "Anulado" };

function concepto(c: CobroFila) {
  return c.descripcion || NOMBRE_CONCEPTO[c.concepto] || c.concepto;
}

export function CobrosLista({ cobros, quien, hoy }: { cobros: CobroFila[]; quien: string; hoy: string }) {
  const [pestana, setPestana] = useState<Pestana>(() =>
    cobros.some((c) => c.estado === "vencido") ? "vencidos" : "por-cobrar",
  );
  const [pagando, setPagando] = useState<CobroFila | null>(null);
  const [viendo, setViendo] = useState<CobroFila | null>(null);
  const lista = cobros.filter((c) => pestanaDe(c.estado) === pestana);
  const cuenta = (p: Pestana) => cobros.filter((c) => pestanaDe(c.estado) === p).length;

  if (cobros.length === 0) {
    return (
      <Vacio
        icono={Receipt}
        titulo="Aún no hay cobros"
        texto="Se crean al marcar una venta como ganada y al generar las mensualidades del mes."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Estado de los cobros" className="flex flex-wrap gap-2" data-recorrido="cobros-pestanas">
        {PESTANAS.map((p) => (
          <Chip
            key={p.id}
            role="tab"
            aria-selected={pestana === p.id}
            seleccionado={pestana === p.id}
            onClick={() => setPestana(p.id)}
          >
            {p.titulo} <span className="numeros">({cuenta(p.id)})</span>
          </Chip>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="text-tinta-suave">Nada aquí.</p>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 lg:hidden" data-testid="cobros-tarjetas">
            {lista.map((c, i) => (
              <li key={c.id} className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4" data-testid="cobro">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/clientes/${c.cliente.id}`} className="block truncate text-medio font-bold hover:underline">
                      {c.cliente.nombre}
                    </Link>
                    <p className="text-tinta-suave">
                      {concepto(c)} · {textoVence(c, hoy)}
                    </p>
                  </div>
                  <Estado estado={ESTADO_VISUAL[c.estado]}>{NOMBRE_ESTADO[c.estado]}</Estado>
                </div>
                <p>
                  {c.estado === "pagado" ? (
                    <Dinero pesos={c.valor} />
                  ) : (
                    <>
                      Saldo <Dinero pesos={c.saldo} />
                      {c.pagado > 0 && <span className="text-tinta-suave"> · pagó {formatearPesos(c.pagado)} de {formatearPesos(c.valor)}</span>}
                    </>
                  )}
                </p>
                <Acciones c={c} quien={quien} primero={i === 0} alPagar={() => setPagando(c)} alVer={() => setViendo(c)} />
              </li>
            ))}
          </ul>

          {/* PC: tabla */}
          <div className="hidden overflow-x-auto rounded-tarjeta border border-borde bg-superficie lg:block">
            <table className="w-full text-left" data-testid="cobros-tabla">
              <thead className="border-b border-borde text-chico text-tinta-suave">
                <tr>
                  <th className="px-4 py-3 font-semibold">Negocio</th>
                  <th className="px-4 py-3 font-semibold">Concepto</th>
                  <th className="px-4 py-3 font-semibold">Vence</th>
                  <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {lista.map((c) => (
                  <tr key={c.id} data-testid="cobro-fila">
                    <td className="px-4 py-3 font-bold">
                      <Link href={`/clientes/${c.cliente.id}`} className="hover:underline">
                        {c.cliente.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{concepto(c)}</td>
                    <td className={cx("px-4 py-3", c.estado === "vencido" && "font-semibold text-error")}>{textoVence(c, hoy)}</td>
                    <td className="numeros px-4 py-3 text-right font-bold">
                      {formatearPesos(c.estado === "pagado" ? c.valor : c.saldo)}
                      {c.pagado > 0 && c.estado !== "pagado" && (
                        <span className="block text-chico font-normal text-tinta-suave">de {formatearPesos(c.valor)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Estado estado={ESTADO_VISUAL[c.estado]}>{NOMBRE_ESTADO[c.estado]}</Estado>
                    </td>
                    <td className="px-4 py-3">
                      <Acciones c={c} quien={quien} compacto alPagar={() => setPagando(c)} alVer={() => setViendo(c)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pagando && <RegistrarPago cobro={pagando} hoy={hoy} alCerrar={() => setPagando(null)} />}
      {viendo && <PagosDeCobro cobro={viendo} alCerrar={() => setViendo(null)} />}
    </div>
  );
}

function textoVence(c: CobroFila, hoy: string) {
  if (c.estado === "pagado") return fechaLarga(c.vence);
  const f = textoFecha(c.vence, hoy);
  return f.estado === "error" ? f.texto.replace("Vencida", "Venció") : `Vence ${f.texto.toLowerCase()}`;
}

function Acciones({
  c,
  quien,
  compacto,
  primero,
  alPagar,
  alVer,
}: {
  c: CobroFila;
  quien: string;
  compacto?: boolean;
  primero?: boolean;
  alPagar: () => void;
  alVer: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {c.estado !== "pagado" && (
        <Boton
          variante={compacto ? "secundario" : "principal"}
          onClick={alPagar}
          data-recorrido={primero ? "cobros-pagar" : undefined}
          icono={<Wallet size={20} strokeWidth={1.75} aria-hidden />}
        >
          {compacto ? "Registrar pago" : `Registrar pago de ${formatearPesos(c.saldo)}`}
        </Boton>
      )}
      {c.pagos.length > 0 && (
        <Boton variante="fantasma" onClick={alVer}>
          Pagos ({c.pagos.length})
        </Boton>
      )}
      {c.estado !== "pagado" && (
        <span data-recorrido={primero ? "cobros-whatsapp" : undefined}>
          <BotonWhatsapp
            compacto
            whatsapp={c.cliente.whatsapp}
            contacto={c.cliente.contacto}
            negocio={c.cliente.nombre}
            producto={concepto(c)}
            quien={quien}
            mensajeInicial={mensajeCobro({
              contacto: c.cliente.contacto,
              negocio: c.cliente.nombre,
              concepto: concepto(c),
              saldo: formatearPesos(c.saldo),
              vence: fechaLarga(c.vence).toLowerCase(),
              quien,
            })}
          />
        </span>
      )}
    </div>
  );
}

function RegistrarPago({ cobro, hoy, alCerrar }: { cobro: CobroFila; hoy: string; alCerrar: () => void }) {
  const avisar = useAvisar();
  const [valorTexto, setValorTexto] = useState(String(cobro.saldo));
  const [fecha, setFecha] = useState(hoy);
  const [medio, setMedio] = useState<MedioPago>("nequi");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const valor = leerPesos(valorTexto) ?? 0;

  return (
    <Hoja abierta alCerrar={alCerrar} titulo={`Pago · ${cobro.cliente.nombre}`}>
      <form
        className="flex flex-col gap-4"
        data-testid="form-pago"
        onSubmit={(e) => {
          e.preventDefault();
          if (valor <= 0) return setError("Escribe cuánto pagó.");
          iniciar(async () => {
            const r = await registrarPago({ cobroId: cobro.id, valor, fecha, medio, referencia: referencia || null });
            if (!r.ok) return setError(r.error);
            avisar(r.mensaje ?? "Pago registrado");
            alCerrar();
          });
        }}
      >
        <p className="text-tinta-suave">
          {concepto(cobro)} · saldo {formatearPesos(cobro.saldo)}
        </p>
        <Campo
          etiqueta="¿Cuánto pagó?"
          inputMode="numeric"
          value={valorTexto}
          onChange={(e) => setValorTexto(e.target.value)}
          ayuda={valor > 0 ? formatearPesos(valor) : "En pesos, sin decimales"}
        />
        <fieldset>
          <legend className="mb-2 font-semibold">¿Por dónde?</legend>
          <div className="flex flex-wrap gap-2">
            {MEDIOS_PAGO.map(([v, t]) => (
              <Chip key={v} seleccionado={medio === v} onClick={() => setMedio(v)}>
                {t}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Campo etiqueta="Fecha" type="date" max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <Campo
          etiqueta="Referencia (opcional)"
          placeholder="Número de la transferencia"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
        />
        <p className="text-chico text-tinta-suave">Las comisiones del equipo se crean solas con este pago.</p>
        {error && (
          <p role="alert" className="font-semibold text-error">
            {error}
          </p>
        )}
        <Boton type="submit" ancho disabled={pendiente}>
          {pendiente ? "Guardando…" : `Registrar ${valor > 0 ? formatearPesos(valor) : "pago"}`}
        </Boton>
      </form>
    </Hoja>
  );
}

function PagosDeCobro({ cobro, alCerrar }: { cobro: CobroFila; alCerrar: () => void }) {
  const avisar = useAvisar();
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  return (
    <Hoja abierta alCerrar={alCerrar} titulo={`Pagos · ${cobro.cliente.nombre}`}>
      <div className="flex flex-col gap-3">
        <p className="text-tinta-suave">
          {concepto(cobro)} · {formatearPesos(cobro.pagado)} de {formatearPesos(cobro.valor)}
        </p>
        <ul className="flex flex-col divide-y divide-borde">
          {cobro.pagos.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Dinero pesos={p.valor} />
                  <p className="text-chico text-tinta-suave">
                    {fechaLarga(p.fecha)} · {MEDIOS_PAGO.find(([v]) => v === p.medio)?.[1] ?? p.medio}
                    {p.referencia && ` · ${p.referencia}`}
                  </p>
                </div>
                {confirmando !== p.id && (
                  <Boton variante="fantasma" onClick={() => setConfirmando(p.id)} icono={<Ban size={20} strokeWidth={1.75} aria-hidden />}>
                    Anular
                  </Boton>
                )}
              </div>
              {confirmando === p.id && (
                <div className="flex flex-col gap-2 rounded-control bg-suave p-3" role="alert">
                  <p className="font-semibold">¿Anular este pago de {formatearPesos(p.valor)}?</p>
                  <p className="text-chico">Sus comisiones pendientes se anulan. El pago queda en el historial como anulado.</p>
                  <div className="flex gap-2">
                    <Boton variante="fantasma" onClick={() => setConfirmando(null)}>
                      No
                    </Boton>
                    <Boton
                      disabled={pendiente}
                      onClick={() =>
                        iniciar(async () => {
                          const r = await anularPago(p.id);
                          avisar(r.ok ? (r.mensaje ?? "Pago anulado") : r.error, r.ok ? (r.datos?.alerta ? "error" : "bien") : "error");
                          if (r.ok) alCerrar();
                        })
                      }
                    >
                      {pendiente ? "Anulando…" : "Sí, anular"}
                    </Boton>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Hoja>
  );
}
