import type { Metadata } from "next";
import { Logo } from "@/components/marca/Logo";
import { PASOS } from "@/lib/guia";
import { obtenerContexto } from "@/lib/sesion";
import { RepetirRecorrido } from "./RepetirRecorrido";

export const metadata: Metadata = { title: "Guía" };

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
