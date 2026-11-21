"use client";
import { useState, useTransition } from "react";
import { PackagePlus, Wrench } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Hoja } from "@/components/ui/Hoja";
import { registrarInstalacion, registrarMovimiento } from "@/lib/acciones/inventario";
import type { Item } from "@/lib/datos-fase4";
import { formatearPesos, leerPesos } from "@/lib/dominio/dinero";

type Tipo = "compra" | "dano" | "ajuste";
const TITULO: Record<Tipo, string> = { compra: "Compra", dano: "Daño o pérdida", ajuste: "Ajuste de conteo" };

/** Compra, daño o ajuste de un ítem. */
export function AccionesItem({ item, primero }: { item: Item; primero?: boolean }) {
  const avisar = useAvisar();
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const n = Number(cantidad);
  const costoN = leerPesos(costo);

  function abrir(t: Tipo) {
    setTipo(t);
    setCantidad("");
    setCosto("");
    setNota("");
    setError(undefined);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2" data-recorrido={primero ? "inventario-comprar" : undefined}>
        <Boton variante="secundario" onClick={() => abrir("compra")} icono={<PackagePlus size={20} strokeWidth={1.75} aria-hidden />}>
          Compra
        </Boton>
        <Boton variante="fantasma" onClick={() => abrir("dano")}>
          Daño
        </Boton>
        <Boton variante="fantasma" onClick={() => abrir("ajuste")}>
          Ajuste
        </Boton>
      </div>
      {/* Solo existe mientras está abierta: no se dibuja un formulario escondido por cada ítem. */}
      {tipo !== null && (
      <Hoja abierta alCerrar={() => setTipo(null)} titulo={`${TITULO[tipo]} · ${item.nombre}`}>
        <form
          className="flex flex-col gap-4"
          data-testid="form-movimiento"
          onSubmit={(e) => {
            e.preventDefault();
            if (!Number.isInteger(n) || n === 0) return setError("Escribe una cantidad entera distinta de cero.");
            if (tipo !== "ajuste" && n < 0) return setError("Escribe la cantidad sin signo.");
            if (costo && costoN == null) return setError("Escribe el costo en pesos, sin decimales.");
            iniciar(async () => {
              const r = await registrarMovimiento({ itemId: item.id, tipo, cantidad: n, costoTotal: costoN ?? null, nota: nota || null });
              if (!r.ok) return setError(r.error);
              avisar(r.mensaje ?? "Listo");
              setTipo(null);
            });
          }}
        >
          <p className="text-tinta-suave">Hoy hay {item.stock}.</p>
          <Campo
            etiqueta={tipo === "ajuste" ? "Cantidad (+ si sobran, − si faltan)" : tipo === "compra" ? "¿Cuántas compraste?" : "¿Cuántas se dañaron?"}
            inputMode={tipo === "ajuste" ? "text" : "numeric"}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            ayuda={Number.isInteger(n) && n !== 0 ? `Quedarían ${item.stock + (tipo === "compra" ? Math.abs(n) : tipo === "dano" ? -Math.abs(n) : n)}` : undefined}
          />
          {tipo === "compra" && (
            <Campo
              etiqueta="Costo total (opcional)"
              inputMode="numeric"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              ayuda={costoN ? formatearPesos(costoN) : "Lo que pagaste por todo"}
            />
          )}
          <Campo etiqueta="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
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
      )}
    </>
  );
}

/** Cantidades que se proponen por instalación (DESIGN/MODELO: −7 stickers, −6 soportes, −1 placa). */
function propuesta(nombre: string): number {
  const n = nombre.toLowerCase();
  if (n.includes("sticker") || n.includes("tag")) return 7;
  if (n.includes("soporte")) return 6;
  if (n.includes("placa")) return 1;
  return 0;
}

/** Al cerrar una instalación: propone los movimientos y el cliente. */
export function RegistrarInstalacion({ items, clientes }: { items: Item[]; clientes: { id: string; nombre: string }[] }) {
  const avisar = useAvisar();
  const [abierta, setAbierta] = useState(false);
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [cantidades, setCantidades] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, String(propuesta(i.nombre))])),
  );
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <Boton onClick={() => setAbierta(true)} data-recorrido="inventario-instalar" icono={<Wrench size={20} strokeWidth={1.75} aria-hidden />}>
        Registrar instalación
      </Boton>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Instalación">
        <form
          className="flex flex-col gap-4"
          data-testid="form-instalacion"
          onSubmit={(e) => {
            e.preventDefault();
            if (!clienteId) return setError("Elige el cliente.");
            const lista = items.map((i) => ({ itemId: i.id, cantidad: Number(cantidades[i.id] || 0) }));
            if (lista.some((x) => !Number.isInteger(x.cantidad) || x.cantidad < 0)) return setError("Las cantidades son números enteros.");
            iniciar(async () => {
              const r = await registrarInstalacion({ clienteId, items: lista });
              if (!r.ok) return setError(r.error);
              avisar(r.mensaje ?? "Listo");
              setAbierta(false);
            });
          }}
        >
          {clientes.length === 0 ? (
            <p className="text-tinta-suave">Primero marca una venta como ganada: aquí aparecen los clientes nuevos.</p>
          ) : (
            <fieldset>
              <legend className="mb-2 font-semibold">¿En qué negocio?</legend>
              <div className="flex flex-wrap gap-2">
                {clientes.slice(0, 8).map((c) => (
                  <Chip key={c.id} seleccionado={clienteId === c.id} onClick={() => setClienteId(c.id)}>
                    {c.nombre}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}
          <p className="text-chico text-tinta-suave">Lo normal de una instalación. Cambia lo que no aplique.</p>
          {items.map((i) => (
            <Campo
              key={i.id}
              etiqueta={`${i.nombre} (hay ${i.stock})`}
              inputMode="numeric"
              value={cantidades[i.id] ?? ""}
              onChange={(e) => setCantidades({ ...cantidades, [i.id]: e.target.value })}
            />
          ))}
          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}
          <Boton type="submit" ancho disabled={pendiente || clientes.length === 0}>
            {pendiente ? "Guardando…" : "Registrar instalación"}
          </Boton>
        </form>
      </Hoja>
    </>
  );
}
