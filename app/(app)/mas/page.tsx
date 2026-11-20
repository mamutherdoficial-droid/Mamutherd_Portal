import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { Boton } from "@/components/ui/Boton";
import { salir } from "@/lib/acciones/sesion";
import { barraInferior, disponible, seccionesDe } from "@/lib/navegacion";
import { obtenerContexto } from "@/lib/sesion";

export const metadata: Metadata = { title: "Más" };

/** "Más" del celular: lo que no cabe en la barra inferior. */
export default async function Mas() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;

  const enBarra = new Set(barraInferior(ctx.rol).map((s) => s.ruta));
  const resto = seccionesDe(ctx.rol).filter((s) => !enBarra.has(s.ruta));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-titulo text-grande leading-tight">Más</h1>
        <p className="text-tinta-suave">
          {ctx.nombre} · {ctx.empresa.nombre}
        </p>
      </header>

      <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
        {resto.map((s) => (
          <li key={s.ruta}>
            {disponible(s) ? (
              <Link href={s.ruta} className="flex min-h-14 items-center justify-between px-4 font-semibold hover:bg-suave">
                {s.etiqueta}
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
              </Link>
            ) : (
              <span className="flex min-h-14 items-center justify-between px-4 font-semibold text-tinta-suave">
                {s.etiqueta}
                <span className="text-chico font-medium">Pronto</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      <form action={salir}>
        <Boton type="submit" variante="secundario" ancho icono={<LogOut size={20} strokeWidth={1.75} aria-hidden />}>
          Cerrar sesión
        </Boton>
      </form>
    </div>
  );
}
