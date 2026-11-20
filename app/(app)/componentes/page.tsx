import type { Metadata } from "next";
import { Muestrario } from "./Muestrario";

export const metadata: Metadata = { title: "Componentes" };

/** Todos los componentes de components/ui en claro y oscuro, con los tokens de Mamut. */
export default function Componentes() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-titulo text-grande leading-tight">Componentes</h1>
        <p className="text-tinta-suave">Así se ven las piezas del portal en tema claro y oscuro.</p>
      </header>
      <div className="grid gap-4 xl:grid-cols-2">
        <Muestrario tema="claro" />
        <Muestrario tema="oscuro" />
      </div>
    </div>
  );
}
