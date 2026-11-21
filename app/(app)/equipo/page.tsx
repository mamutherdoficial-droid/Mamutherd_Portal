import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, CircleAlert, Users } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { Dinero } from "@/components/ui/Dinero";
import { Vacio } from "@/components/ui/Vacio";
import { equipo } from "@/lib/datos-cobros";
import { obtenerContexto } from "@/lib/sesion";

export const metadata: Metadata = { title: "Equipo" };

// Fase 2 (D-036): lista sencilla para llegar a lo que se le debe a cada persona.
// Invitar personas y tareas llegan en la Fase 3.
export default async function Equipo() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  if (ctx.rol !== "gerente") redirect("/mis-comisiones");

  const personas = await equipo(ctx.empresa.id);
  const total = personas.reduce((s, p) => s + p.porPagar, 0);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-titulo text-grande leading-tight">Equipo</h1>
        <p className="text-tinta-suave">
          Por pagar al equipo: <Dinero pesos={total} className="!text-base" />
        </p>
      </header>
      {personas.length === 0 ? (
        <Vacio icono={Users} titulo="Aún no hay nadie en el equipo" />
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie" data-recorrido="equipo-lista">
          {personas.map((p) => (
            <li key={p.id}>
              <Link href={`/equipo/${p.id}`} className="flex min-h-16 items-center gap-3 px-4 py-2 hover:bg-suave" data-testid="persona-equipo">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.nombre}</p>
                  <p className="text-chico text-tinta-suave">
                    {p.rol === "gerente" ? "Gerente" : "Ayudante"}
                    {p.alertas > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 font-semibold text-error">
                        <CircleAlert size={14} strokeWidth={1.75} aria-hidden /> {p.alertas} por descontar
                      </span>
                    )}
                  </p>
                </div>
                {p.porPagar > 0 && <Dinero pesos={p.porPagar} className="!text-base" />}
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden className="text-tinta-suave" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <OfrecerRecorrido id="equipo" />
    </div>
  );
}
