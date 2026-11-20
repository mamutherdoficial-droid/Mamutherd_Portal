"use client";
import { useMemo, useState } from "react";
import { Handshake } from "lucide-react";
import { TarjetaOportunidad } from "@/components/dominio/TarjetaOportunidad";
import { Chip } from "@/components/ui/Chip";
import { Vacio } from "@/components/ui/Vacio";
import { ETAPAS_ABIERTAS, NOMBRE_ETAPA } from "@/lib/dominio/etapas";
import type { Miembro, OportunidadFila, Producto } from "@/lib/datos";

type Props = {
  oportunidades: OportunidadFila[];
  productos: Producto[];
  miembros: Miembro[];
  esGerente: boolean;
  quien: string;
};

/** Lista agrupada por etapa (no tablero arrastrable en el celular), con filtros. */
export function VentasLista({ oportunidades, productos, miembros, esGerente, quien }: Props) {
  const [producto, setProducto] = useState<string | null>(null);
  const [vendedor, setVendedor] = useState<string>("");
  const [sinFecha, setSinFecha] = useState(false);
  const [cerradas, setCerradas] = useState(false);

  const filtradas = useMemo(
    () =>
      oportunidades.filter(
        (o) =>
          (!producto || o.producto.id === producto) &&
          (!vendedor || o.responsable?.id === vendedor || o.vendedores.some((v) => v.miembro_id === vendedor)) &&
          (!sinFecha || !o.proxima_fecha),
      ),
    [oportunidades, producto, vendedor, sinFecha],
  );

  const grupos = ETAPAS_ABIERTAS.map((etapa) => ({ etapa, lista: filtradas.filter((o) => o.etapa === etapa) }));
  const ganadas = filtradas.filter((o) => o.etapa === "ganada");
  const perdidas = filtradas.filter((o) => o.etapa === "perdida");
  const abiertas = grupos.reduce((n, g) => n + g.lista.length, 0);
  // La primera tarjeta visible lleva los data-recorrido del product tour.
  const primeraId = grupos.find((g) => g.lista.length > 0)?.lista[0]?.id;

  if (oportunidades.length === 0) {
    return (
      <Vacio
        icono={Handshake}
        titulo="Aún no hay ventas"
        texto="Cada visita que anotes crea o mueve una venta. Empieza con el botón Anotar visita."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3" data-recorrido="ventas-filtros">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Producto">
          <Chip seleccionado={producto === null} onClick={() => setProducto(null)}>
            Todos
          </Chip>
          {productos.map((p) => (
            <Chip key={p.id} seleccionado={producto === p.id} onClick={() => setProducto(p.id)}>
              {p.nombre}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {esGerente && miembros.length > 0 && (
            <select
              aria-label="Vendedor"
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              className="min-h-11 rounded-full border border-borde bg-superficie px-4 font-semibold"
            >
              <option value="">Todo el equipo</option>
              {miembros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          )}
          <Chip seleccionado={sinFecha} onClick={() => setSinFecha(!sinFecha)}>
            Sin próxima fecha
          </Chip>
          <Chip seleccionado={cerradas} onClick={() => setCerradas(!cerradas)}>
            Ver cerradas
          </Chip>
        </div>
      </div>

      {abiertas === 0 && !cerradas && <Vacio icono={Handshake} titulo="Nada con esos filtros" />}

      <div className="grid gap-6 xl:grid-cols-2">
        {grupos
          .filter((g) => g.lista.length > 0)
          .map((g, k) => (
            <section key={g.etapa} aria-labelledby={`etapa-${g.etapa}`} className="flex flex-col gap-3">
              <h2
                id={`etapa-${g.etapa}`}
                className="flex items-center gap-2 text-medio font-bold"
                data-recorrido={k === 0 ? "ventas-etapas" : undefined}
              >
                {NOMBRE_ETAPA[g.etapa]}
                <span className="numeros rounded-full bg-suave px-2 text-chico">{g.lista.length}</span>
              </h2>
              {g.lista.map((o) => (
                <TarjetaOportunidad key={o.id} o={o} quien={quien} primero={o.id === primeraId} />
              ))}
            </section>
          ))}
      </div>

      {cerradas && (
        <div className="grid gap-6 xl:grid-cols-2">
          {[
            { titulo: "Ganadas", lista: ganadas },
            { titulo: "Perdidas", lista: perdidas },
          ].map((g) => (
            <section key={g.titulo} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-medio font-bold">
                {g.titulo}
                <span className="numeros rounded-full bg-suave px-2 text-chico">{g.lista.length}</span>
              </h2>
              {g.lista.length === 0 ? (
                <p className="text-tinta-suave">Ninguna.</p>
              ) : (
                g.lista.map((o) => <TarjetaOportunidad key={o.id} o={o} quien={quien} />)
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
