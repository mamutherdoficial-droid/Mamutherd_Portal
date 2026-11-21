"use client";
import { useTransition } from "react";
import { Camera, CheckCircle2, Circle, ListChecks, X } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Estado } from "@/components/ui/Chip";
import { cx } from "@/components/ui/clases";
import { Dinero } from "@/components/ui/Dinero";
import { Vacio } from "@/components/ui/Vacio";
import { cambiarTarea } from "@/lib/acciones/equipo";
import type { TareaFila } from "@/lib/datos-equipo";
import { diaBogota, textoFecha } from "@/lib/dominio/semanas";

const TIPO: Record<string, string> = {
  general: "General",
  seguimiento: "Seguimiento",
  fotos: "Fotos",
  instalacion: "Instalación",
  diseno: "Diseño",
};

/** Lista de tareas: pendientes primero (vencidas arriba), luego las hechas recientes. */
export function ListaTareas({
  tareas,
  esGerente,
  mostrarPersona = true,
}: {
  tareas: TareaFila[];
  esGerente: boolean;
  mostrarPersona?: boolean;
}) {
  const pendientes = tareas.filter((t) => t.estado === "pendiente");
  const hechas = tareas.filter((t) => t.estado === "hecha");

  if (pendientes.length + hechas.length === 0) {
    return <Vacio icono={ListChecks} titulo="Sin tareas" texto={esGerente ? "Asigna la primera con «Nueva tarea»." : "Cuando te asignen una, aparece aquí."} />;
  }
  return (
    <div className="flex flex-col gap-4">
      {pendientes.length > 0 && (
        <ul className="flex flex-col divide-y divide-borde" data-testid="tareas-pendientes">
          {pendientes.map((t, i) => (
            <Fila key={t.id} t={t} esGerente={esGerente} mostrarPersona={mostrarPersona} primera={i === 0} />
          ))}
        </ul>
      )}
      {hechas.length > 0 && (
        <details className="group">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-tinta-suave">Hechas ({hechas.length})</summary>
          <ul className="flex flex-col divide-y divide-borde" data-testid="tareas-hechas">
            {hechas.map((t) => (
              <Fila key={t.id} t={t} esGerente={esGerente} mostrarPersona={mostrarPersona} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Fila({ t, esGerente, mostrarPersona, primera }: { t: TareaFila; esGerente: boolean; mostrarPersona: boolean; primera?: boolean }) {
  const avisar = useAvisar();
  const [pendiente, iniciar] = useTransition();
  const hecha = t.estado === "hecha";
  const f = t.vence && !hecha ? textoFecha(t.vence, diaBogota()) : null;

  function cambiar(estado: "hecha" | "pendiente" | "cancelada") {
    iniciar(async () => {
      const r = await cambiarTarea(t.id, estado);
      avisar(r.ok ? (r.mensaje ?? "Listo") : r.error, r.ok ? "bien" : "error");
    });
  }

  return (
    <li className={cx("flex items-start gap-3 py-3", pendiente && "opacity-60")} data-testid="tarea">
      <button
        type="button"
        onClick={() => cambiar(hecha ? "pendiente" : "hecha")}
        disabled={pendiente}
        aria-label={hecha ? `Reabrir «${t.titulo}»` : `Marcar hecha «${t.titulo}»`}
        data-recorrido={primera ? "tareas-marcar" : undefined}
        className="-ml-2 grid size-11 shrink-0 place-items-center rounded-control hover:bg-suave"
      >
        {hecha ? (
          <CheckCircle2 size={24} strokeWidth={1.75} aria-hidden className="text-bien" />
        ) : (
          <Circle size={24} strokeWidth={1.75} aria-hidden className="text-tinta-suave" />
        )}
      </button>
      <div className="min-w-0 flex-1 pt-2">
        <p className={cx("font-semibold", hecha && "text-tinta-suave line-through")}>{t.titulo}</p>
        <p className="text-chico text-tinta-suave">
          {t.tipo === "fotos" && <Camera size={14} strokeWidth={1.75} aria-hidden className="mr-1 inline" />}
          {TIPO[t.tipo] ?? t.tipo}
          {mostrarPersona && t.asignada && ` · ${t.asignada.nombre}`}
          {f && (
            <span className={cx("font-semibold", f.estado === "error" && "text-error", f.estado === "alerta" && "text-alerta")}>
              {" · "}
              {f.texto.replace("Vencida", "Venció")}
            </span>
          )}
        </p>
        {t.descripcion && <p className="text-chico">{t.descripcion}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 pt-2">
        {t.valor_trabajo != null && t.valor_trabajo > 0 && <Dinero pesos={t.valor_trabajo} className="!text-base" />}
        {hecha && t.valor_trabajo ? (
          <Estado estado={t.trabajo_pagado_en ? "bien" : "alerta"}>{t.trabajo_pagado_en ? "Pagado" : "Por pagar"}</Estado>
        ) : null}
        {esGerente && !hecha && (
          <Boton variante="fantasma" className="!min-h-9 !px-2" onClick={() => cambiar("cancelada")} disabled={pendiente} aria-label={`Cancelar «${t.titulo}»`}>
            <X size={18} strokeWidth={1.75} aria-hidden />
          </Boton>
        )}
      </div>
    </li>
  );
}
