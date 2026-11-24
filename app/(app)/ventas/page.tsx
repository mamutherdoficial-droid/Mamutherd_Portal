import type { Metadata } from "next";
import Link from "next/link";
import { List, Map as IconoMapa } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { AnotarVisita } from "@/components/dominio/AnotarVisita";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { cx } from "@/components/ui/clases";
import { clientesCortos, miembrosActivos, oportunidades, productosActivos } from "@/lib/datos";
import { planesActivos } from "@/lib/datos-cobros";
import { negociosUbicados } from "@/lib/datos-mapa";
import { obtenerContexto } from "@/lib/sesion";
import { VentasLista } from "./VentasLista";
import { VentasMapa } from "./VentasMapa";

export const metadata: Metadata = { title: "Ventas" };

export default async function Ventas({ searchParams }: PageProps<"/ventas">) {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  const { vista } = await searchParams;
  const enMapa = vista === "mapa";

  const esGerente = ctx.rol === "gerente";
  const [lista, productos, miembros, clientes, planes, ubicados] = await Promise.all([
    oportunidades(ctx.empresa.id),
    productosActivos(ctx.empresa.id),
    ctx.rol === "gerente" ? miembrosActivos(ctx.empresa.id) : Promise.resolve([]),
    clientesCortos(ctx.empresa.id),
    esGerente ? planesActivos(ctx.empresa.id) : Promise.resolve([]),
    enMapa ? negociosUbicados(ctx.empresa.id) : Promise.resolve([]),
  ]);
  const quien = ctx.nombre.split(" ")[0]!;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-grande leading-tight">Ventas</h1>
          <p className="text-tinta-suave">
            {ctx.rol === "gerente" ? "Todas las ventas de la empresa, por etapa." : "Tus ventas, por etapa."}
          </p>
        </div>
        <nav aria-label="Vista" className="flex rounded-full border border-borde bg-superficie p-1" data-recorrido="ventas-vista">
          {[
            { href: "/ventas", texto: "Lista", icono: List, activo: !enMapa },
            { href: "/ventas?vista=mapa", texto: "Mapa", icono: IconoMapa, activo: enMapa },
          ].map((v) => (
            <Link
              key={v.texto}
              href={v.href}
              aria-current={v.activo ? "page" : undefined}
              className={cx("inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 font-semibold", v.activo ? "bg-principal text-sobre-principal" : "hover:bg-suave")}
            >
              <v.icono size={18} strokeWidth={1.75} aria-hidden /> {v.texto}
            </Link>
          ))}
        </nav>
      </header>
      {enMapa ? (
        <VentasMapa negocios={ubicados} oportunidades={lista} quien={quien} />
      ) : (
        <VentasLista
          oportunidades={lista}
          productos={productos}
          miembros={miembros}
          esGerente={ctx.rol === "gerente"}
          quien={quien}
          gerencia={esGerente ? { planes, miembros } : undefined}
        />
      )}
      <AnotarVisita clientes={clientes} productos={productos} />
      <OfrecerRecorrido id="ventas" />
    </div>
  );
}
