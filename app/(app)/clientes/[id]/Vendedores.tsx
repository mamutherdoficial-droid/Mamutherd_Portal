"use client";
import { useState, useTransition } from "react";
import { UserPlus, X } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Chip } from "@/components/ui/Chip";
import { Hoja } from "@/components/ui/Hoja";
import { asignarVendedor, quitarVendedor } from "@/lib/acciones/ventas";
import type { Miembro, OportunidadFila } from "@/lib/datos";

const ATRIBUCIONES = [
  { valor: "propia", etiqueta: "Propia", ayuda: "La consiguió ella" },
  { valor: "conjunta", etiqueta: "Conjunta", ayuda: "Salieron juntos, Jacobo cierra" },
  { valor: "referido", etiqueta: "Referido", ayuda: "Solo pasó el contacto" },
] as const;

/** Gerente: quién comisiona por esta venta y cuánto (D-004). Las comisiones las crea la base al pagar. */
export function Vendedores({
  oportunidadId,
  vendedores,
  miembros,
}: {
  oportunidadId: string;
  vendedores: OportunidadFila["vendedores"];
  miembros: Miembro[];
}) {
  const avisar = useAvisar();
  const [abierta, setAbierta] = useState(false);
  const [miembroId, setMiembroId] = useState("");
  const [atribucion, setAtribucion] = useState<(typeof ATRIBUCIONES)[number]["valor"]>("propia");
  const [parte, setParte] = useState<1 | 0.5>(1);
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const ayudantes = miembros.filter((m) => m.rol === "ayudante");

  return (
    <div className="rounded-tarjeta border border-dashed border-borde px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-chico font-semibold text-tinta-suave">Comisionan:</span>
        {vendedores.length === 0 && <span className="text-chico text-tinta-suave">nadie</span>}
        {vendedores.map((v) => (
          <span key={v.miembro_id} className="inline-flex items-center gap-1 rounded-full bg-suave pl-3 text-chico font-semibold">
            {v.nombre} · {v.atribucion}
            {v.parte < 1 && " · ½"}
            <button
              type="button"
              aria-label={`Quitar a ${v.nombre}`}
              className="grid size-9 place-items-center rounded-full hover:bg-glaciar"
              onClick={() =>
                iniciar(async () => {
                  const r = await quitarVendedor(oportunidadId, v.miembro_id);
                  avisar(r.ok ? "Vendedor quitado" : r.error, r.ok ? "bien" : "error");
                })
              }
            >
              <X size={16} strokeWidth={1.75} aria-hidden />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setAbierta(true)}
          className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-chico font-semibold hover:bg-suave"
        >
          <UserPlus size={16} strokeWidth={1.75} aria-hidden /> Asignar
        </button>
      </div>

      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="¿Quién vendió?">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await asignarVendedor({ oportunidadId, miembroId, atribucion, parte });
              if (!r.ok) return setError(r.error);
              setError(undefined);
              avisar("Vendedor guardado");
              setAbierta(false);
            });
          }}
        >
          {ayudantes.length === 0 ? (
            <p className="text-tinta-suave">Aún no hay ayudantes en el equipo. Llegan en la fase 3 (o agrégalas en Supabase).</p>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">Persona</span>
              <select
                required
                value={miembroId}
                onChange={(e) => setMiembroId(e.target.value)}
                className="min-h-12 rounded-control border border-borde bg-superficie px-4"
              >
                <option value="">Elige…</option>
                {ayudantes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <fieldset>
            <legend className="mb-2 font-semibold">¿Cómo se dio la venta?</legend>
            <div className="flex flex-col gap-2">
              {ATRIBUCIONES.map((a) => (
                <Chip key={a.valor} seleccionado={atribucion === a.valor} onClick={() => setAtribucion(a.valor)} className="justify-between">
                  {a.etiqueta}
                  <span className="font-medium opacity-80">{a.ayuda}</span>
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-semibold">¿Cuánto le toca?</legend>
            <div className="flex gap-2">
              <Chip seleccionado={parte === 1} onClick={() => setParte(1)}>
                Toda
              </Chip>
              <Chip seleccionado={parte === 0.5} onClick={() => setParte(0.5)}>
                La mitad (dos personas)
              </Chip>
            </div>
          </fieldset>
          <p className="text-chico text-tinta-suave">
            Asígnalo antes del primer pago: la comisión se crea cuando el negocio paga, no antes.
          </p>
          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}
          <Boton type="submit" ancho disabled={pendiente || ayudantes.length === 0}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
        </form>
      </Hoja>
    </div>
  );
}
