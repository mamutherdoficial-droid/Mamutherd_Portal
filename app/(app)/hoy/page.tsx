import type { Metadata } from "next";
import { CalendarClock, Footprints, ListChecks } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Vacio } from "@/components/ui/Vacio";
import { diaBogota, fechaLarga } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";

export const metadata: Metadata = { title: "Hoy" };

// Fase 0: "Hoy" vacío. Seguimientos, meta de la semana y "Anotar visita" llegan en la fase 1.
export default async function Hoy() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;

  const nombre = ctx.nombre.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-tinta-suave">{fechaLarga(diaBogota())}</p>
        <h1 className="font-titulo text-grande leading-tight">Hola, {nombre}</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Meta de la semana">
          <Vacio
            icono={Footprints}
            titulo="Aún no hay visitas esta semana"
            texto="La primera es la más difícil."
          />
        </Tarjeta>
        <Tarjeta titulo="Seguimientos">
          <Vacio
            icono={CalendarClock}
            titulo="Nada pendiente para hoy"
            texto="Cuando anotes visitas, aquí ves a quién volver a llamar."
          />
        </Tarjeta>
        <Tarjeta titulo="Tareas" className="lg:col-span-2">
          <Vacio icono={ListChecks} titulo="Sin tareas para hoy" />
        </Tarjeta>
      </div>
    </div>
  );
}
