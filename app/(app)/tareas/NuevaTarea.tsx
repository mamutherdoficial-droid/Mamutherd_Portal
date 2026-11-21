"use client";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Hoja } from "@/components/ui/Hoja";
import { crearTarea } from "@/lib/acciones/equipo";
import type { Miembro } from "@/lib/datos";
import { formatearPesos, leerPesos } from "@/lib/dominio/dinero";

const TIPOS = [
  ["general", "General"],
  ["seguimiento", "Seguimiento"],
  ["fotos", "Fotos"],
  ["instalacion", "Instalación"],
  ["diseno", "Diseño"],
] as const;

/** Gerente: crea y asigna una tarea. Con "valor del trabajo", al marcarla hecha queda por pagar. */
export function NuevaTarea({ miembros }: { miembros: Miembro[] }) {
  const avisar = useAvisar();
  const [abierta, setAbierta] = useState(false);
  const [tipo, setTipo] = useState<(typeof TIPOS)[number][0]>("general");
  const [valorTexto, setValorTexto] = useState("");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const valor = leerPesos(valorTexto);

  return (
    <>
      <Boton onClick={() => setAbierta(true)} data-recorrido="tareas-nueva" icono={<Plus size={20} strokeWidth={1.75} aria-hidden />}>
        Nueva tarea
      </Boton>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Nueva tarea">
        <form
          className="flex flex-col gap-4"
          data-testid="form-tarea"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (valorTexto && valor == null) return setError("Escribe el valor en pesos, sin decimales.");
            iniciar(async () => {
              const r = await crearTarea({
                titulo: String(f.get("titulo") ?? ""),
                tipo,
                asignadaA: String(f.get("asignada") ?? ""),
                vence: String(f.get("vence") ?? "") || null,
                valorTrabajo: valor ?? null,
                descripcion: String(f.get("descripcion") ?? "") || null,
              });
              if (!r.ok) return setError(r.error);
              setError(undefined);
              setValorTexto("");
              avisar(r.mensaje ?? "Listo");
              setAbierta(false);
            });
          }}
        >
          <Campo etiqueta="¿Qué hay que hacer?" name="titulo" required placeholder="Fotos de la carta de Café Luna" />
          <fieldset>
            <legend className="mb-2 font-semibold">Tipo</legend>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map(([v, t]) => (
                <Chip key={v} seleccionado={tipo === v} onClick={() => setTipo(v)}>
                  {t}
                </Chip>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">¿Para quién?</span>
            <select name="asignada" required defaultValue="" className="min-h-12 rounded-control border border-borde bg-superficie px-4">
              <option value="" disabled>
                Elige…
              </option>
              {miembros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>
          <Campo etiqueta="¿Para cuándo?" name="vence" type="date" />
          <Campo
            etiqueta="Valor del trabajo (opcional)"
            inputMode="numeric"
            value={valorTexto}
            onChange={(e) => setValorTexto(e.target.value)}
            ayuda={valor ? `${formatearPesos(valor)} · al marcarla hecha queda por pagar` : "Si es un trabajo pagado, como una sesión de fotos."}
          />
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Detalles (opcional)</span>
            <textarea name="descripcion" rows={2} className="rounded-control border border-borde bg-superficie px-4 py-3 focus:outline-2 focus:outline-tinta" />
          </label>
          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}
          <Boton type="submit" ancho disabled={pendiente}>
            {pendiente ? "Guardando…" : "Asignar tarea"}
          </Boton>
        </form>
      </Hoja>
    </>
  );
}
