import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search, Store } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { AnotarVisita } from "@/components/dominio/AnotarVisita";
import { Boton } from "@/components/ui/Boton";
import { Vacio } from "@/components/ui/Vacio";
import { buscarClientes, clientesCortos, productosActivos } from "@/lib/datos";
import { obtenerContexto } from "@/lib/sesion";
import { ImportarExportar } from "./ImportarExportar";

export const metadata: Metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: PageProps<"/clientes">) {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  const { q } = await searchParams;
  const texto = typeof q === "string" ? q.slice(0, 80) : "";

  const [lista, productos, cortos] = await Promise.all([
    buscarClientes(ctx.empresa.id, texto),
    productosActivos(ctx.empresa.id),
    clientesCortos(ctx.empresa.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-titulo text-grande leading-tight">Clientes</h1>
        <p className="text-tinta-suave">
          {ctx.rol === "gerente" ? "Todos los negocios de la empresa." : "Los negocios que tú llevas."}
        </p>
      </header>

      <form role="search" className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar negocio</span>
          <Search
            size={20}
            strokeWidth={1.75}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave"
          />
          <input
            type="search"
            name="q"
            defaultValue={texto}
            placeholder="Negocio, barrio o dueño"
            className="min-h-12 w-full rounded-control border border-borde bg-superficie pl-10 pr-4 placeholder:text-tinta-suave focus:outline-2 focus:outline-tinta"
          />
        </label>
        <Boton type="submit" variante="secundario">
          Buscar
        </Boton>
      </form>

      {lista.length === 0 ? (
        <Vacio
          icono={Store}
          titulo={texto ? `No encontramos «${texto}»` : "Aún no hay clientes"}
          texto={texto ? "Revisa cómo lo escribiste o anótalo como visita nueva." : "Cuando anotes una visita a un negocio nuevo, aparece aquí."}
        />
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
          {lista.map((c) => (
            <li key={c.id}>
              <Link href={`/clientes/${c.id}`} className="flex min-h-16 items-center gap-3 px-4 py-2 hover:bg-suave">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.nombre_negocio}</p>
                  <p className="truncate text-chico text-tinta-suave">
                    {[c.tipo_negocio, c.barrio, c.contacto_nombre].filter(Boolean).join(" · ") || "Sin datos todavía"}
                  </p>
                </div>
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden className="text-tinta-suave" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {ctx.rol === "gerente" && <ImportarExportar />}

      <AnotarVisita clientes={cortos} productos={productos} />
    </div>
  );
}
