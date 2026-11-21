import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Boxes, TriangleAlert } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Vacio } from "@/components/ui/Vacio";
import { ganadosRecientes, inventario, movimientosRecientes } from "@/lib/datos-fase4";
import { formatearPesos } from "@/lib/dominio/dinero";
import { fechaLarga } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";
import { AccionesItem, RegistrarInstalacion } from "./Acciones";

export const metadata: Metadata = { title: "Inventario" };

const TIPO: Record<string, string> = { compra: "Compra", instalacion: "Instalación", asignacion: "Asignación", dano: "Daño", ajuste: "Ajuste" };

export default async function Inventario() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  if (ctx.rol !== "gerente") redirect("/hoy");

  const [items, movimientos, clientes] = await Promise.all([
    inventario(ctx.empresa.id),
    movimientosRecientes(ctx.empresa.id),
    ganadosRecientes(ctx.empresa.id),
  ]);
  const bajos = items.filter((i) => i.bajo);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-grande leading-tight">Inventario</h1>
          <p className="text-tinta-suave">Tags NFC, soportes y placas.</p>
        </div>
        {items.length > 0 && <RegistrarInstalacion items={items} clientes={clientes} />}
      </header>

      {bajos.length > 0 && (
        <p role="alert" className="flex items-center gap-2 rounded-tarjeta border-2 border-alerta/50 bg-superficie p-4 font-semibold" data-testid="alerta-stock">
          <TriangleAlert size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-alerta" />
          Stock bajo: {bajos.map((b) => `${b.nombre} (${b.stock})`).join(", ")}. Toca comprar.
        </p>
      )}

      {items.length === 0 ? (
        <Vacio icono={Boxes} titulo="Sin ítems de inventario" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-recorrido="inventario-items">
          {items.map((i, k) => (
            <li key={i.id} className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4" data-testid="item-inventario">
              <div>
                <p className="font-bold">{i.nombre}</p>
                <p className="flex items-baseline gap-2">
                  <span className={`numeros text-grande font-bold ${i.bajo ? "text-error" : ""}`} data-testid="stock">
                    {i.stock}
                  </span>
                  <span className="text-tinta-suave">
                    {i.unidad === "unidad" ? "unidades" : i.unidad} · mínimo {i.stock_minimo}
                  </span>
                </p>
                {i.costo_unitario != null && <p className="text-chico text-tinta-suave">Costo: {formatearPesos(i.costo_unitario)} c/u</p>}
              </div>
              <AccionesItem item={i} primero={k === 0} />
            </li>
          ))}
        </ul>
      )}

      <Tarjeta titulo="Movimientos recientes">
        {movimientos.length === 0 ? (
          <p className="text-tinta-suave">Todavía ninguno.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borde">
            {movimientos.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {TIPO[m.tipo] ?? m.tipo} · {m.item}
                  </p>
                  <p className="truncate text-chico text-tinta-suave">
                    {fechaLarga(m.fecha)}
                    {m.cliente && ` · ${m.cliente}`}
                    {m.costo_total != null && ` · ${formatearPesos(m.costo_total)}`}
                    {m.nota && ` · ${m.nota}`}
                  </p>
                </div>
                <span className={`numeros font-bold ${m.cantidad > 0 ? "text-bien" : ""}`}>
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
      <OfrecerRecorrido id="inventario" />
    </div>
  );
}
