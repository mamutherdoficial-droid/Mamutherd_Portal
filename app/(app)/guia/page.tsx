import type { Metadata } from "next";
import { Logo } from "@/components/marca/Logo";
import { obtenerContexto } from "@/lib/sesion";
import { RepetirRecorrido } from "./RepetirRecorrido";

export const metadata: Metadata = { title: "Guía" };

const PASOS = [
  {
    titulo: "Entra",
    hace: "Abre el portal y entra con tu correo y contraseña.",
    ve: "La pantalla Hoy, con lo que tienes pendiente.",
    truco: "Agrégalo a la pantalla de inicio del celular para abrirlo como app.",
  },
  {
    titulo: "Anota la visita",
    hace: "Al salir de cada negocio, toca Anotar visita.",
    ve: "El negocio, el producto, cómo te fue y cuándo vuelves.",
    truco: "Elige «Mañana» o «En 3 días»: así el seguimiento te sale solo en Hoy.",
  },
  {
    titulo: "Mueve tus ventas",
    hace: "En Ventas, pasa cada venta a su siguiente etapa.",
    ve: "Tus ventas agrupadas: contactado, demo, propuesta.",
    truco: "Si se pierde, escribe el motivo: sirve para mejorar el guion.",
  },
  {
    titulo: "Registra el pago",
    hace: "Cuando el negocio paga, regístralo en Cobros. La primera venta se cierra con «Ganada».",
    ve: "Lo que te deben y lo que ya entró.",
    truco: "La comisión aparece cuando el negocio paga, no antes.",
  },
  {
    titulo: "Revisa la semana",
    hace: "El domingo abre «Resumen de la semana» (desde Hoy o Metas).",
    ve: "Visitas, dueños y clientes contra la meta.",
    truco: "15 minutos de revisión el domingo valen por toda la semana.",
  },
];

export default async function Guia() {
  const ctx = await obtenerContexto();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-titulo text-grande leading-tight">Guía</h1>
        <p className="text-tinta-suave">Cómo se usa el portal, en 5 pasos.</p>
      </header>

      <ol className="flex flex-col gap-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="rounded-tarjeta border border-borde bg-superficie p-4">
            <h2 className="flex items-center gap-3 text-medio font-bold">
              <span className="numeros grid size-8 place-items-center rounded-full bg-principal text-sobre-principal">
                {i + 1}
              </span>
              {p.titulo}
            </h2>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="text-chico font-semibold text-tinta-suave">Qué haces</dt>
                <dd>{p.hace}</dd>
              </div>
              <div>
                <dt className="text-chico font-semibold text-tinta-suave">Qué ves</dt>
                <dd>{p.ve}</dd>
              </div>
              <div>
                <dt className="text-chico font-semibold text-tinta-suave">Truco</dt>
                <dd>{p.truco}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>

      {ctx && <RepetirRecorrido />}

      <footer className="flex justify-center pt-4">
        <Logo logo="sello-linea" alto={24} />
      </footer>
    </div>
  );
}
