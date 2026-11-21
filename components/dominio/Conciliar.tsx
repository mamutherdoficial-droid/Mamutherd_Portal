"use client";
import { useRef, useState, useTransition } from "react";
import { Check, FileUp, Landmark } from "lucide-react";
import { Hotspot } from "@/components/recorrido/Hotspot";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Chip, Estado } from "@/components/ui/Chip";
import { Dinero } from "@/components/ui/Dinero";
import { confirmarMovimiento, descartarMovimiento, subirExtracto } from "@/lib/acciones/conciliar";
import type { MovimientoPropuesto } from "@/lib/datos-cobros";
import { TEXTO_PROPUESTA, type CobroPendiente, type Propuesta } from "@/lib/dominio/extractos/coincidencias";
import { formatearPesos } from "@/lib/dominio/dinero";
import { fechaLarga } from "@/lib/dominio/semanas";

export type Revision = { movimiento: MovimientoPropuesto; propuesta: Propuesta };

const ESTADO = { "valor-y-nombre": "bien", "solo-valor": "alerta", "sin-coincidencia": "neutro" } as const;

/**
 * Panel "Conciliar con el banco" (D-017): sube el extracto, propone y el gerente confirma.
 * Confirmar crea el pago (y la base crea las comisiones); nada se registra sin ese toque.
 */
export function Conciliar({ revisiones, pendientes }: { revisiones: Revision[]; pendientes: CobroPendiente[] }) {
  return (
    <section className="flex flex-col gap-4 rounded-tarjeta border border-borde bg-superficie p-4" aria-labelledby="conciliar-titulo" data-testid="conciliar">
      <h2 id="conciliar-titulo" className="flex items-center gap-2 text-medio font-bold">
        <Landmark size={20} strokeWidth={1.75} aria-hidden /> Conciliar con el banco
      </h2>
      <SubirExtracto />
      {revisiones.length === 0 ? (
        <p className="text-tinta-suave">No hay ingresos por revisar. Sube el extracto de la semana.</p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="por-revisar">
          {revisiones.map((r) => (
            <FilaRevision key={r.movimiento.id} r={r} pendientes={pendientes} />
          ))}
        </ul>
      )}
      <p className="text-chico text-tinta-suave">Nada se registra hasta que tocas Confirmar.</p>
    </section>
  );
}

function SubirExtracto() {
  const avisar = useAvisar();
  const form = useRef<HTMLFormElement>(null);
  const [banco, setBanco] = useState<"bancolombia" | "nequi">("bancolombia");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  return (
    <form
      ref={form}
      className="flex flex-col gap-3"
      data-testid="form-extracto"
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        datos.set("banco", banco);
        iniciar(async () => {
          const r = await subirExtracto(datos);
          if (!r.ok) return setError(r.error);
          setError(undefined);
          form.current?.reset();
          avisar(r.mensaje ?? "Listo");
        });
      }}
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Banco">
        <Chip seleccionado={banco === "bancolombia"} onClick={() => setBanco("bancolombia")}>
          Bancolombia
        </Chip>
        <Chip seleccionado={banco === "nequi"} onClick={() => setBanco("nequi")}>
          Nequi
        </Chip>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">Extracto (.csv o .xlsx)</span>
        <input
          type="file"
          name="archivo"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="min-h-12 rounded-control border border-borde bg-superficie px-3 py-2 file:mr-3 file:rounded-control file:border-0 file:bg-suave file:px-3 file:py-1.5 file:font-semibold"
        />
      </label>
      {error && (
        <p role="alert" className="font-semibold text-error">
          {error}
        </p>
      )}
      <div className="relative self-start">
        <Boton type="submit" variante="secundario" disabled={pendiente} icono={<FileUp size={20} strokeWidth={1.75} aria-hidden />}>
          {pendiente ? "Leyendo…" : "Subir extracto"}
        </Boton>
        <Hotspot
          id="hotspot-extracto"
          version={1}
          titulo="Nuevo: concilia con el banco"
          texto="Descarga el extracto de Bancolombia o Nequi y súbelo: te proponemos a qué cobro corresponde cada ingreso."
        />
      </div>
    </form>
  );
}

function FilaRevision({ r, pendientes }: { r: Revision; pendientes: CobroPendiente[] }) {
  const avisar = useAvisar();
  const [pendiente, iniciar] = useTransition();
  const [eligiendo, setEligiendo] = useState(r.propuesta.tipo === "sin-coincidencia");
  const [cobroId, setCobroId] = useState(r.propuesta.cobro?.id ?? "");
  const m = r.movimiento;
  const elegido = pendientes.find((c) => c.id === cobroId) ?? r.propuesta.cobro;
  // Al elegir a mano: primero los del mismo valor, luego los que alcanzan (saldo ≥ valor).
  const opciones = [...pendientes.filter((c) => c.saldo === m.valor), ...pendientes.filter((c) => c.saldo > m.valor)];

  return (
    <li className="flex flex-col gap-2 rounded-control border border-borde p-3" data-testid="movimiento">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Dinero pesos={m.valor} />
          <p className="truncate text-chico text-tinta-suave" title={m.descripcion}>
            {fechaLarga(m.fecha)} · {m.descripcion || "Sin descripción"}
          </p>
        </div>
        <Estado estado={ESTADO[r.propuesta.tipo]}>{TEXTO_PROPUESTA[r.propuesta.tipo]}</Estado>
      </div>

      {!eligiendo && elegido ? (
        <p>
          → <strong>{elegido.cliente}</strong> · {elegido.concepto} · saldo {formatearPesos(elegido.saldo)}
        </p>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-chico font-semibold">¿A qué cobro corresponde?</span>
          <select value={cobroId} onChange={(e) => setCobroId(e.target.value)} className="min-h-11 rounded-control border border-borde bg-superficie px-3">
            <option value="">Elige…</option>
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cliente} · {c.concepto} · saldo {formatearPesos(c.saldo)}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        <Boton
          disabled={pendiente || !cobroId}
          icono={<Check size={20} strokeWidth={1.75} aria-hidden />}
          onClick={() =>
            iniciar(async () => {
              const res = await confirmarMovimiento(m.id, cobroId);
              avisar(res.ok ? (res.mensaje ?? "Confirmado") : res.error, res.ok ? "bien" : "error");
            })
          }
        >
          Confirmar
        </Boton>
        {!eligiendo && (
          <Boton
            variante="fantasma"
            onClick={() => {
              setEligiendo(true);
              setCobroId("");
            }}
          >
            No es este
          </Boton>
        )}
        <Boton
          variante="fantasma"
          disabled={pendiente}
          onClick={() =>
            iniciar(async () => {
              const res = await descartarMovimiento(m.id);
              avisar(res.ok ? (res.mensaje ?? "Ignorado") : res.error, res.ok ? "bien" : "error");
            })
          }
        >
          Ignorar
        </Boton>
      </div>
    </li>
  );
}
