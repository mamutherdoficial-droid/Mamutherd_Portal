"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TriangleAlert } from "lucide-react";
import { useRecorridos } from "@/components/recorrido/Recorridos";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Chip } from "@/components/ui/Chip";
import { cx } from "@/components/ui/clases";
import { Hoja } from "@/components/ui/Hoja";
import { anotarVisita } from "@/lib/acciones/visitas";
import { RESULTADOS, type Resultado } from "@/lib/dominio/etapas";
import { diaBogota, fechaLarga, inicioSemana, sumarDias } from "@/lib/dominio/semanas";
import { PASOS_FORMULARIO_VISITA } from "@/lib/recorridos";
import type { ClienteCorto, Producto } from "@/lib/datos";

const CLAVE_PRODUCTO = "portal-mamut:ultimo-producto";

function sinTildes(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

type Props = {
  clientes: ClienteCorto[];
  productos: Producto[];
  /** En la ficha de un cliente: el negocio ya viene elegido. */
  clienteFijo?: { id: string; nombre: string };
};

/**
 * Botón flotante "Anotar visita" (ámbar, una sola cosa por pantalla) + la hoja del formulario.
 * Meta: menos de 20 segundos y 6 toques (DESIGN.md → Anotar visita).
 */
export function AnotarVisita({ clientes, productos, clienteFijo }: Props) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button
        type="button"
        data-recorrido="anotar-visita"
        onClick={() => setAbierta(true)}
        className={cx(
          "fixed right-4 z-20 inline-flex min-h-14 items-center gap-2 rounded-full bg-ambar px-5 font-bold text-sobre-ambar shadow-lg",
          "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-8 lg:right-8",
          "transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta",
        )}
      >
        <Plus size={22} strokeWidth={2} aria-hidden />
        Anotar visita
      </button>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Anotar visita">
        {abierta && (
          <FormVisita
            clientes={clientes}
            productos={productos}
            clienteFijo={clienteFijo}
            alGuardar={() => setAbierta(false)}
          />
        )}
      </Hoja>
    </>
  );
}

function FormVisita({ clientes, productos, clienteFijo, alGuardar }: Props & { alGuardar: () => void }) {
  const router = useRouter();
  const avisar = useAvisar();
  const { guiandoVisita, terminarVisitaGuiada } = useRecorridos();

  const [busqueda, setBusqueda] = useState("");
  const [cliente, setCliente] = useState<{ id: string | null; nombre: string } | null>(clienteFijo ?? null);
  const [productoId, setProductoId] = useState<string | null>(null);
  const [dueno, setDueno] = useState<boolean | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [accion, setAccion] = useState("");
  const [fecha, setFecha] = useState<string | null>(null);
  const [sinFecha, setSinFecha] = useState(false);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);
  const buscador = useRef<HTMLInputElement>(null);

  // El último producto usado queda elegido.
  useEffect(() => {
    let guardado: string | null = null;
    try {
      guardado = window.localStorage.getItem(CLAVE_PRODUCTO);
    } catch {}
    const valido = productos.find((p) => p.id === guardado) ?? productos[0];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lee localStorage, solo existe en el navegador
    if (valido) setProductoId(valido.id);
  }, [productos]);

  useEffect(() => {
    if (!clienteFijo) buscador.current?.focus();
  }, [clienteFijo]);

  const hoy = diaBogota();
  const atajos = useMemo(
    () => [
      { etiqueta: "Mañana", fecha: sumarDias(hoy, 1) },
      { etiqueta: "En 3 días", fecha: sumarDias(hoy, 3) },
      { etiqueta: "Próxima semana", fecha: sumarDias(inicioSemana(hoy), 7) },
    ],
    [hoy],
  );

  const coincidencias = useMemo(() => {
    const q = sinTildes(busqueda);
    if (!q) return [];
    return clientes.filter((c) => sinTildes(c.nombre).includes(q)).slice(0, 6);
  }, [busqueda, clientes]);
  const existeIgual = coincidencias.some((c) => sinTildes(c.nombre) === sinTildes(busqueda));

  const perdida = resultado === "no_interesa";
  const faltaFecha = !perdida && resultado !== null && !fecha;

  // Paso guiado actual (solo en la primera visita).
  const pasoGuiado = !guiandoVisita
    ? null
    : !cliente
      ? 0
      : !productoId
        ? 1
        : dueno === null
          ? 2
          : resultado === null
            ? 3
            : 4;
  const resaltar = (k: number) =>
    pasoGuiado === k ? "rounded-tarjeta outline-2 outline-offset-4 outline-ambar" : undefined;

  function elegirResultado(r: Resultado) {
    setResultado(r);
    const sugerida = RESULTADOS.find((x) => x.valor === r)?.accion ?? "";
    if (!accion || RESULTADOS.some((x) => x.accion === accion)) setAccion(sugerida);
  }

  async function guardar() {
    if (!cliente) return setError("Escribe el nombre del negocio.");
    if (!productoId) return setError("Elige el producto.");
    if (dueno === null) return setError("Dinos si hablaste con el dueño.");
    if (!resultado) return setError("Elige cómo te fue.");
    setError(undefined);
    setGuardando(true);
    const r = await anotarVisita({
      clienteId: cliente.id,
      nombreNegocio: cliente.id ? null : cliente.nombre,
      productoId,
      habloConDueno: dueno,
      resultado,
      proximaAccion: perdida ? null : accion || null,
      proximaFecha: perdida ? null : fecha,
      nota: nota || null,
    });
    setGuardando(false);
    if (!r.ok) return setError(r.error);
    try {
      window.localStorage.setItem(CLAVE_PRODUCTO, productoId);
    } catch {}
    terminarVisitaGuiada();
    avisar(r.datos?.clienteNuevo ? `Visita anotada · ${cliente.nombre} es cliente nuevo` : "Visita anotada");
    alGuardar();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5" data-testid="form-visita">
      {pasoGuiado !== null && (
        <p
          role="status"
          className="rounded-control border-2 border-ambar bg-suave px-3 py-2 font-semibold"
          data-testid="paso-guiado"
        >
          {pasoGuiado + 1} de {PASOS_FORMULARIO_VISITA.length} · {PASOS_FORMULARIO_VISITA[pasoGuiado]!.texto}
        </p>
      )}

      {/* 1. Negocio */}
      <fieldset className={cx("flex flex-col gap-2", resaltar(0))}>
        <legend className="mb-2 font-semibold">Negocio</legend>
        {cliente ? (
          <div className="flex min-h-12 items-center justify-between gap-2 rounded-control border border-borde bg-suave px-4">
            <span className="font-semibold">
              {cliente.nombre}
              {!cliente.id && <span className="ml-2 text-chico font-medium text-tinta-suave">(nuevo)</span>}
            </span>
            {!clienteFijo && (
              <button
                type="button"
                className="min-h-11 px-2 text-chico font-semibold underline underline-offset-4"
                onClick={() => {
                  setCliente(null);
                  window.setTimeout(() => buscador.current?.focus(), 0);
                }}
              >
                Cambiar
              </button>
            )}
          </div>
        ) : (
          <>
            <input
              ref={buscador}
              type="search"
              aria-label="Nombre del negocio"
              placeholder="Café Luna"
              autoComplete="off"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && busqueda.trim().length >= 2) {
                  e.preventDefault();
                  const igual = coincidencias.find((c) => sinTildes(c.nombre) === sinTildes(busqueda));
                  setCliente(igual ? { id: igual.id, nombre: igual.nombre } : { id: null, nombre: busqueda.trim() });
                }
              }}
              className="min-h-12 w-full rounded-control border border-borde bg-superficie px-4 text-medio placeholder:text-tinta-suave focus:outline-2 focus:outline-tinta"
            />
            {busqueda.trim().length >= 2 && (
              <ul className="flex flex-col gap-1" aria-label="Negocios">
                {coincidencias.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setCliente({ id: c.id, nombre: c.nombre })}
                      className="flex min-h-12 w-full items-center justify-between rounded-control px-3 text-left hover:bg-suave"
                    >
                      <span className="font-semibold">{c.nombre}</span>
                      {c.barrio && <span className="text-chico text-tinta-suave">{c.barrio}</span>}
                    </button>
                  </li>
                ))}
                {!existeIgual && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setCliente({ id: null, nombre: busqueda.trim() })}
                      className="flex min-h-12 w-full items-center gap-2 rounded-control border border-dashed border-borde px-3 text-left font-semibold hover:bg-suave"
                    >
                      <Plus size={20} strokeWidth={1.75} aria-hidden />
                      Crear «{busqueda.trim()}»
                    </button>
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </fieldset>

      {/* 2. Producto */}
      <fieldset className={resaltar(1)}>
        <legend className="mb-2 font-semibold">Producto</legend>
        <div className="flex flex-wrap gap-2">
          {productos.map((p) => (
            <Chip key={p.id} seleccionado={productoId === p.id} onClick={() => setProductoId(p.id)}>
              {p.nombre}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* 3. ¿Hablaste con el dueño? */}
      <fieldset className={resaltar(2)}>
        <legend className="mb-2 font-semibold">¿Hablaste con el dueño?</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, t: "Sí" },
            { v: false, t: "No" },
          ].map((o) => (
            <Boton
              key={o.t}
              variante={dueno === o.v ? "principal" : "secundario"}
              aria-pressed={dueno === o.v}
              onClick={() => setDueno(o.v)}
            >
              {o.t}
            </Boton>
          ))}
        </div>
      </fieldset>

      {/* 4. Resultado */}
      <fieldset className={resaltar(3)}>
        <legend className="mb-2 font-semibold">¿Cómo te fue?</legend>
        <div className="flex flex-wrap gap-2">
          {RESULTADOS.map((r) => (
            <Chip key={r.valor} seleccionado={resultado === r.valor} onClick={() => elegirResultado(r.valor)}>
              {r.etiqueta}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* 5. Próxima acción y fecha */}
      {!perdida && (
        <fieldset className={cx("flex flex-col gap-2", resaltar(4))}>
          <legend className="mb-2 font-semibold">¿Cuándo vuelves?</legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Próxima fecha">
            {atajos.map((a) => (
              <Chip
                key={a.etiqueta}
                seleccionado={fecha === a.fecha}
                onClick={() => {
                  setFecha(a.fecha);
                  setSinFecha(false);
                }}
              >
                {a.etiqueta}
              </Chip>
            ))}
            <Chip
              seleccionado={sinFecha}
              onClick={() => {
                setFecha(null);
                setSinFecha(true);
              }}
            >
              Sin fecha
            </Chip>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              aria-label="Próxima acción"
              placeholder="Volver con la demo"
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="min-h-12 rounded-control border border-borde bg-superficie px-4 placeholder:text-tinta-suave focus:outline-2 focus:outline-tinta"
            />
            <input
              type="date"
              aria-label="Otra fecha"
              min={hoy}
              value={fecha ?? ""}
              onChange={(e) => {
                setFecha(e.target.value || null);
                setSinFecha(false);
              }}
              className="min-h-12 rounded-control border border-borde bg-superficie px-3 focus:outline-2 focus:outline-tinta"
            />
          </div>
          {fecha && <p className="text-chico text-tinta-suave">Sale en Hoy el {fechaLarga(fecha).toLowerCase()}.</p>}
          {faltaFecha && (
            <p className="flex items-center gap-2 text-chico font-semibold text-alerta">
              <TriangleAlert size={16} strokeWidth={1.75} aria-hidden />
              Sin fecha, esta venta no te va a aparecer en Hoy.
            </p>
          )}
        </fieldset>
      )}

      {/* 6. Nota */}
      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">{perdida ? "¿Por qué no le interesa?" : "Nota (opcional)"}</span>
        <textarea
          rows={2}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={perdida ? "Ya tiene carta en PDF" : "Le gustó la ruleta de premios"}
          className="rounded-control border border-borde bg-superficie px-4 py-3 placeholder:text-tinta-suave focus:outline-2 focus:outline-tinta"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-control border border-error/40 bg-error/10 p-3 font-semibold text-error">
          {error}
        </p>
      )}

      <Boton ancho onClick={guardar} disabled={guardando} className="sticky bottom-0">
        {guardando ? "Guardando…" : "Guardar"}
      </Boton>
    </div>
  );
}
