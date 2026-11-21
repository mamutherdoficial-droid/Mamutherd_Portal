import type { Metadata } from "next";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { miembrosActivos } from "@/lib/datos";
import { tareas } from "@/lib/datos-equipo";
import { obtenerContexto } from "@/lib/sesion";
import { ListaTareas } from "./ListaTareas";
import { NuevaTarea } from "./NuevaTarea";

export const metadata: Metadata = { title: "Tareas" };

export default async function Tareas() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  const esGerente = ctx.rol === "gerente";
  // RLS: la ayudante solo recibe las suyas.
  const [lista, miembros] = await Promise.all([
    tareas(ctx.empresa.id),
    esGerente ? miembrosActivos(ctx.empresa.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-grande leading-tight">{esGerente ? "Tareas" : "Mis tareas"}</h1>
          <p className="text-tinta-suave">{esGerente ? "Lo que tiene que hacer cada quien." : "Lo que te asignaron. Márcala cuando la termines."}</p>
        </div>
        {esGerente && <NuevaTarea miembros={miembros} />}
      </header>
      <section className="rounded-tarjeta border border-borde bg-superficie px-4 py-2">
        <ListaTareas tareas={lista} esGerente={esGerente} />
      </section>
      <OfrecerRecorrido id={esGerente ? "tareas" : "mis-tareas"} />
    </div>
  );
}
