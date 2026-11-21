"use client";
import { useState, useTransition } from "react";
import { CircleAlert, HandCoins } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Dinero } from "@/components/ui/Dinero";
import { Hoja } from "@/components/ui/Hoja";
import { marcarAjustada, pagarAyudante } from "@/lib/acciones/cobros";
import type { AlertaComision } from "@/lib/datos-cobros";
import { MEDIOS_PAGO, type MedioPago } from "@/lib/dominio/cobros";
import { formatearPesos } from "@/lib/dominio/dinero";
import { fechaLarga } from "@/lib/dominio/semanas";

type Item = { id: string; valor: number; texto: string };

/** Lo que se le debe a una persona; se elige qué se le pagó y se marca con fecha y medio. */
export function PagarAyudante({
  miembroId,
  hoy,
  comisiones,
  trabajos,
}: {
  miembroId: string;
  hoy: string;
  comisiones: Item[];
  trabajos: Item[];
}) {
  const avisar = useAvisar();
  const todos = [...comisiones.map((c) => c.id), ...trabajos.map((t) => t.id)];
  const [elegidos, setElegidos] = useState<Set<string>>(() => new Set(todos));
  const [abierta, setAbierta] = useState(false);
  const [fecha, setFecha] = useState(hoy);
  const [medio, setMedio] = useState<MedioPago>("nequi");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const total = [...comisiones, ...trabajos].filter((x) => elegidos.has(x.id)).reduce((s, x) => s + x.valor, 0);

  function alternar(id: string) {
    setElegidos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const fila = (x: Item, tipo: string) => (
    <li key={x.id}>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
        <input type="checkbox" className="size-5 accent-[var(--color-principal)]" checked={elegidos.has(x.id)} onChange={() => alternar(x.id)} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{x.texto}</span>
          <span className="text-chico text-tinta-suave">{tipo}</span>
        </span>
        <Dinero pesos={x.valor} className="!text-base" />
      </label>
    </li>
  );

  return (
    <div className="flex flex-col gap-3" data-recorrido="equipo-pagar">
      <ul className="flex flex-col divide-y divide-borde" data-testid="por-pagar">
        {comisiones.map((c) => fila(c, "Comisión"))}
        {trabajos.map((t) => fila(t, "Trabajo"))}
      </ul>
      <Boton
        ancho
        disabled={total === 0}
        onClick={() => setAbierta(true)}
        icono={<HandCoins size={20} strokeWidth={1.75} aria-hidden />}
      >
        Marcar como pagado · {formatearPesos(total)}
      </Boton>

      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="¿Cuándo y cómo le pagaste?">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await pagarAyudante({
                miembroId,
                comisiones: comisiones.filter((c) => elegidos.has(c.id)).map((c) => c.id),
                trabajos: trabajos.filter((t) => elegidos.has(t.id)).map((t) => t.id),
                fecha,
                medio,
              });
              if (!r.ok) return setError(r.error);
              avisar(r.mensaje ?? "Marcado como pagado");
              setAbierta(false);
            });
          }}
        >
          <p>
            Total: <Dinero pesos={total} />
          </p>
          <Campo etiqueta="Fecha" type="date" max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <fieldset>
            <legend className="mb-2 font-semibold">Medio</legend>
            <div className="flex flex-wrap gap-2">
              {MEDIOS_PAGO.map(([v, t]) => (
                <Chip key={v} seleccionado={medio === v} onClick={() => setMedio(v)}>
                  {t}
                </Chip>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}
          <Boton type="submit" ancho disabled={pendiente}>
            {pendiente ? "Guardando…" : "Confirmar pago"}
          </Boton>
        </form>
      </Hoja>
    </div>
  );
}

/** Comisiones ya pagadas cuyo pago se anuló: hay que descontarlas del siguiente pago. */
export function AlertasDescontar({ alertas }: { alertas: AlertaComision[] }) {
  const avisar = useAvisar();
  const [pendiente, iniciar] = useTransition();
  return (
    <section className="flex flex-col gap-3 rounded-tarjeta border-2 border-error/50 bg-superficie p-4" role="alert" data-testid="alertas-descontar">
      <h2 className="flex items-center gap-2 text-medio font-bold text-error">
        <CircleAlert size={20} strokeWidth={1.75} aria-hidden /> Descuenta del próximo pago
      </h2>
      <p className="text-chico">Ya pagaste estas comisiones, pero el pago del negocio se anuló.</p>
      <ul className="flex flex-col divide-y divide-borde">
        {alertas.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              <span className="font-semibold">{a.negocio}</span> · pago del {fechaLarga(a.pago_fecha).toLowerCase()} ·{" "}
              <Dinero pesos={a.valor} className="!text-base" />
            </span>
            <Boton
              variante="secundario"
              disabled={pendiente}
              onClick={() =>
                iniciar(async () => {
                  const r = await marcarAjustada(a.id);
                  avisar(r.ok ? (r.mensaje ?? "Listo") : r.error, r.ok ? "bien" : "error");
                })
              }
            >
              Ya lo descontó
            </Boton>
          </li>
        ))}
      </ul>
    </section>
  );
}
