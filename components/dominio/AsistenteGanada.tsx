"use client";
import { useState, useTransition } from "react";
import { ArrowLeft, Trophy, UserPlus } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Dinero } from "@/components/ui/Dinero";
import { Hoja } from "@/components/ui/Hoja";
import { ganarVenta } from "@/lib/acciones/cobros";
import { asignarVendedor } from "@/lib/acciones/ventas";
import { anticipoSugerido, MEDIOS_PAGO, mesSiguiente, type MedioPago } from "@/lib/dominio/cobros";
import { formatearPesos, leerPesos } from "@/lib/dominio/dinero";
import { diaBogota } from "@/lib/dominio/semanas";
import type { Plan } from "@/lib/datos-cobros";
import type { Miembro, OportunidadFila } from "@/lib/datos";

const PASOS = ["¿Quién vendió?", "Instalación", "Mensualidad", "Anticipo"] as const;
const ATRIBUCIONES = [
  { valor: "propia", etiqueta: "Propia", ayuda: "La consiguió ella" },
  { valor: "conjunta", etiqueta: "Conjunta", ayuda: "Salieron juntos" },
  { valor: "referido", etiqueta: "Referido", ayuda: "Solo pasó el contacto" },
] as const;

type Props = { o: OportunidadFila; planes: Plan[]; miembros: Miembro[]; abierta: boolean; alCerrar: () => void };

/**
 * Asistente "Ganada" (gerente). Primero confirma vendedores (si se agregan después del primer pago,
 * ese pago no genera comisión); luego instalación, mensualidad y anticipo. Todo se guarda junto
 * con ganar_oportunidad (D-038). Las comisiones las crea la base.
 */
export function AsistenteGanada({ o, planes, miembros, abierta, alCerrar }: Props) {
  const avisar = useAvisar();
  const hoy = diaBogota();
  const unicos = planes.filter((p) => p.producto_id === o.producto.id && p.tipo === "unico");
  const mensuales = planes.filter((p) => p.producto_id === o.producto.id && p.tipo === "mensual");

  const [paso, setPaso] = useState(0);
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  // Paso 1: vendedores
  const [agregando, setAgregando] = useState(false);
  const [miembroId, setMiembroId] = useState("");
  const [atribucion, setAtribucion] = useState<(typeof ATRIBUCIONES)[number]["valor"]>("propia");
  const [parte, setParte] = useState<1 | 0.5>(1);
  const ayudantes = miembros.filter((m) => m.rol === "ayudante");

  // Paso 2: instalación
  const primero = unicos.find((p) => p.precio != null) ?? unicos[0];
  const [planInst, setPlanInst] = useState(primero?.id ?? "");
  const [valorTexto, setValorTexto] = useState(primero?.precio ? String(primero.precio) : "");
  const [vence, setVence] = useState(hoy);
  const valor = leerPesos(valorTexto) ?? 0;

  // Paso 3: mensualidad
  const [planMes, setPlanMes] = useState<string>(mensuales[0]?.id ?? "");
  const [precioMesTexto, setPrecioMesTexto] = useState(mensuales[0]?.precio != null ? String(mensuales[0].precio) : "");
  const [diaCobro, setDiaCobro] = useState("5");
  const [inicia, setInicia] = useState(mesSiguiente(hoy));

  // Paso 4: anticipo
  const sugerido = anticipoSugerido(valor);
  const [anticipoModo, setAnticipoModo] = useState<"mitad" | "todo" | "otro" | "nada">("mitad");
  const [otroTexto, setOtroTexto] = useState("");
  const [medio, setMedio] = useState<MedioPago>("nequi");
  const [fechaPago, setFechaPago] = useState(hoy);
  const anticipo =
    anticipoModo === "mitad" ? sugerido : anticipoModo === "todo" ? valor : anticipoModo === "otro" ? leerPesos(otroTexto) ?? 0 : 0;

  function agregarVendedor() {
    if (!miembroId) return setError("Elige la persona.");
    iniciar(async () => {
      const r = await asignarVendedor({ oportunidadId: o.id, miembroId, atribucion, parte });
      if (!r.ok) return setError(r.error);
      setError(undefined);
      setAgregando(false);
      setMiembroId("");
      avisar("Vendedor guardado");
    });
  }

  function siguiente() {
    setError(undefined);
    if (paso === 1) {
      if (!planInst) return setError("Elige el plan de instalación.");
      if (valor <= 0) return setError("Escribe el valor de la instalación.");
    }
    if (paso === 2 && planMes) {
      const d = Number(diaCobro);
      if (!Number.isInteger(d) || d < 1 || d > 28) return setError("El día de cobro va del 1 al 28.");
      if (leerPesos(precioMesTexto) == null) return setError("Escribe el precio de la mensualidad.");
    }
    setPaso(paso + 1);
  }

  function guardar() {
    if (anticipo > valor) return setError("El anticipo no puede ser mayor que la instalación.");
    if (anticipoModo === "otro" && anticipo <= 0) return setError("Escribe el valor del anticipo.");
    iniciar(async () => {
      const r = await ganarVenta({
        oportunidadId: o.id,
        planInstalacion: planInst,
        valor,
        vence,
        planMensual: planMes || null,
        precioMensual: planMes ? leerPesos(precioMesTexto) : null,
        diaCobro: Number(diaCobro) || 1,
        inicia: planMes ? inicia : null,
        anticipo: anticipo > 0 ? anticipo : null,
        medio,
        fechaPago,
      });
      if (!r.ok) return setError(r.error);
      avisar(r.mensaje ?? "¡Venta ganada!");
      alCerrar();
      setPaso(0);
    });
  }

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo={`Ganada · ${o.cliente.nombre}`}>
      <div className="flex flex-col gap-4" data-testid="asistente-ganada">
        <p className="text-chico font-semibold text-tinta-suave">
          Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}
        </p>

        {paso === 0 && (
          <section className="flex flex-col gap-3">
            <p>
              Confirma quién comisiona <strong>antes del primer pago</strong>: si lo agregas después, ese pago no le
              genera comisión.
            </p>
            {o.vendedores.length === 0 ? (
              <p className="rounded-control bg-suave px-4 py-3 font-semibold">Nadie comisiona por esta venta.</p>
            ) : (
              <ul className="flex flex-col gap-2" data-testid="vendedores-confirmar">
                {o.vendedores.map((v) => (
                  <li key={v.miembro_id} className="rounded-control bg-suave px-4 py-3 font-semibold">
                    {v.nombre} · {v.atribucion}
                    {v.parte < 1 && " · la mitad"}
                  </li>
                ))}
              </ul>
            )}
            {agregando ? (
              <div className="flex flex-col gap-3 rounded-tarjeta border border-borde p-3">
                <label className="flex flex-col gap-1.5">
                  <span className="font-semibold">Persona</span>
                  <select
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
                <div className="flex flex-wrap gap-2" role="group" aria-label="Atribución">
                  {ATRIBUCIONES.map((a) => (
                    <Chip key={a.valor} seleccionado={atribucion === a.valor} onClick={() => setAtribucion(a.valor)}>
                      {a.etiqueta}
                    </Chip>
                  ))}
                </div>
                <p className="text-chico text-tinta-suave">{ATRIBUCIONES.find((a) => a.valor === atribucion)?.ayuda}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Parte">
                  <Chip seleccionado={parte === 1} onClick={() => setParte(1)}>
                    Toda
                  </Chip>
                  <Chip seleccionado={parte === 0.5} onClick={() => setParte(0.5)}>
                    La mitad
                  </Chip>
                </div>
                <Boton variante="secundario" onClick={agregarVendedor} disabled={pendiente}>
                  Guardar vendedor
                </Boton>
              </div>
            ) : (
              ayudantes.length > 0 && (
                <Boton
                  variante="fantasma"
                  onClick={() => setAgregando(true)}
                  icono={<UserPlus size={20} strokeWidth={1.75} aria-hidden />}
                >
                  Agregar vendedor
                </Boton>
              )
            )}
          </section>
        )}

        {paso === 1 && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Plan de instalación">
              {unicos.map((p) => (
                <Chip
                  key={p.id}
                  seleccionado={planInst === p.id}
                  onClick={() => {
                    setPlanInst(p.id);
                    if (p.precio != null) setValorTexto(String(p.precio));
                  }}
                >
                  {p.nombre}
                  {p.precio != null && ` · ${formatearPesos(p.precio)}`}
                </Chip>
              ))}
            </div>
            <Campo
              etiqueta="Valor de la instalación"
              inputMode="numeric"
              value={valorTexto}
              onChange={(e) => setValorTexto(e.target.value)}
              ayuda={valor > 0 ? formatearPesos(valor) : "En pesos, sin decimales"}
            />
            <Campo etiqueta="Fecha de pago acordada" type="date" value={vence} onChange={(e) => setVence(e.target.value)} />
          </section>
        )}

        {paso === 2 && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Plan mensual">
              {mensuales.map((p) => (
                <Chip
                  key={p.id}
                  seleccionado={planMes === p.id}
                  onClick={() => {
                    setPlanMes(p.id);
                    setPrecioMesTexto(p.precio != null ? String(p.precio) : "");
                  }}
                >
                  {p.nombre}
                  {p.precio != null && ` · ${formatearPesos(p.precio)}`}
                </Chip>
              ))}
              <Chip seleccionado={planMes === ""} onClick={() => setPlanMes("")}>
                Sin mensualidad
              </Chip>
            </div>
            {planMes && (
              <>
                <Campo
                  etiqueta="Precio mensual (queda congelado)"
                  inputMode="numeric"
                  value={precioMesTexto}
                  onChange={(e) => setPrecioMesTexto(e.target.value)}
                  ayuda="Los fundadores conservan su precio 12 meses."
                />
                <Campo
                  etiqueta="Día de cobro (1 a 28)"
                  inputMode="numeric"
                  value={diaCobro}
                  onChange={(e) => setDiaCobro(e.target.value)}
                />
                <Campo etiqueta="Empieza" type="date" value={inicia} onChange={(e) => setInicia(e.target.value)} />
              </>
            )}
          </section>
        )}

        {paso === 3 && (
          <section className="flex flex-col gap-3">
            <p>
              Instalación: <Dinero pesos={valor} />
            </p>
            <div className="flex flex-col gap-2" role="group" aria-label="Anticipo">
              <Chip seleccionado={anticipoModo === "mitad"} onClick={() => setAnticipoModo("mitad")} className="justify-between">
                Anticipo del 50% <span>{formatearPesos(sugerido)}</span>
              </Chip>
              <Chip seleccionado={anticipoModo === "todo"} onClick={() => setAnticipoModo("todo")} className="justify-between">
                Pagó todo <span>{formatearPesos(valor)}</span>
              </Chip>
              <Chip seleccionado={anticipoModo === "otro"} onClick={() => setAnticipoModo("otro")}>
                Otro valor
              </Chip>
              <Chip seleccionado={anticipoModo === "nada"} onClick={() => setAnticipoModo("nada")}>
                Todavía no pagó
              </Chip>
            </div>
            {anticipoModo === "otro" && (
              <Campo etiqueta="Valor del anticipo" inputMode="numeric" value={otroTexto} onChange={(e) => setOtroTexto(e.target.value)} />
            )}
            {anticipoModo !== "nada" && (
              <>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Medio de pago">
                  {MEDIOS_PAGO.map(([v, t]) => (
                    <Chip key={v} seleccionado={medio === v} onClick={() => setMedio(v)}>
                      {t}
                    </Chip>
                  ))}
                </div>
                <Campo etiqueta="Fecha del pago" type="date" max={hoy} value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
              </>
            )}
            <p className="text-chico text-tinta-suave">La comisión aparece cuando el negocio paga, no antes.</p>
          </section>
        )}

        {error && (
          <p role="alert" className="font-semibold text-error">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          {paso > 0 && (
            <Boton variante="fantasma" onClick={() => setPaso(paso - 1)} icono={<ArrowLeft size={20} strokeWidth={1.75} aria-hidden />}>
              Atrás
            </Boton>
          )}
          {paso < PASOS.length - 1 ? (
            <Boton className="flex-1" onClick={siguiente} disabled={pendiente || (paso === 0 && agregando)}>
              {paso === 0 ? "Los vendedores están bien" : "Siguiente"}
            </Boton>
          ) : (
            <Boton
              className="flex-1"
              onClick={guardar}
              disabled={pendiente}
              icono={<Trophy size={20} strokeWidth={1.75} aria-hidden />}
            >
              {pendiente ? "Guardando…" : "Marcar como ganada"}
            </Boton>
          )}
        </div>
      </div>
    </Hoja>
  );
}
