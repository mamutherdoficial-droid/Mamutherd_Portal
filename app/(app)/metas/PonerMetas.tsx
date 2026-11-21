"use client";
import { useState, useTransition } from "react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { guardarMetas } from "@/lib/acciones/inventario";
import type { Miembro } from "@/lib/datos";
import { leerPesos } from "@/lib/dominio/dinero";
import { INDICADORES, NOMBRE_INDICADOR, type Indicador } from "@/lib/dominio/metas";

type Actual = { semana: string; miembroId: string | null; indicador: string; objetivo: number };

/** Gerente: metas de la empresa o de una persona, para esta semana o la siguiente. */
export function PonerMetas({
  semanas,
  miembros,
  actuales,
}: {
  semanas: { lunes: string; texto: string }[];
  miembros: Miembro[];
  actuales: Actual[];
}) {
  const avisar = useAvisar();
  const [semana, setSemana] = useState(semanas[semanas.length - 1]!.lunes);
  const [miembroId, setMiembroId] = useState<string | null>(null);
  const valores = (s: string, m: string | null) =>
    Object.fromEntries(
      INDICADORES.map((i) => [i, String(actuales.find((a) => a.semana === s && a.miembroId === m && a.indicador === i)?.objetivo ?? "")]),
    ) as Record<Indicador, string>;
  const [objetivos, setObjetivos] = useState<Record<Indicador, string>>(() => valores(semana, null));
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  function elegir(s: string, m: string | null) {
    setSemana(s);
    setMiembroId(m);
    setObjetivos(valores(s, m));
    setError(undefined);
  }

  return (
    <form
      className="flex flex-col gap-4"
      data-testid="form-metas"
      onSubmit={(e) => {
        e.preventDefault();
        const metas = INDICADORES.filter((i) => objetivos[i].trim() !== "").map((i) => ({
          indicador: i,
          objetivo: (i === "ingresos" ? leerPesos(objetivos[i]) : Number(objetivos[i])) ?? NaN,
        }));
        if (metas.length === 0) return setError("Escribe al menos una meta.");
        if (metas.some((m) => !Number.isInteger(m.objetivo) || m.objetivo < 0)) return setError("Las metas son números enteros.");
        iniciar(async () => {
          const r = await guardarMetas({ semana, miembroId, metas });
          if (!r.ok) return setError(r.error);
          avisar(r.mensaje ?? "Metas guardadas");
        });
      }}
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Semana">
        {semanas.map((s) => (
          <Chip key={s.lunes} seleccionado={semana === s.lunes} onClick={() => elegir(s.lunes, miembroId)}>
            {s.texto}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Para quién">
        <Chip seleccionado={miembroId === null} onClick={() => elegir(semana, null)}>
          Toda la empresa
        </Chip>
        {miembros.map((m) => (
          <Chip key={m.id} seleccionado={miembroId === m.id} onClick={() => elegir(semana, m.id)}>
            {m.nombre}
          </Chip>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {INDICADORES.map((i) => (
          <Campo
            key={i}
            etiqueta={NOMBRE_INDICADOR[i]}
            inputMode="numeric"
            value={objetivos[i]}
            onChange={(e) => setObjetivos({ ...objetivos, [i]: e.target.value })}
            placeholder={i === "ingresos" ? "400.000" : "0"}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="font-semibold text-error">
          {error}
        </p>
      )}
      <Boton type="submit" ancho disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar metas"}
      </Boton>
    </form>
  );
}
