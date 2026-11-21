import type { Metadata } from "next";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { AnotarVisita } from "@/components/dominio/AnotarVisita";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { clientesCortos, miembrosActivos, oportunidades, productosActivos } from "@/lib/datos";
import { planesActivos } from "@/lib/datos-cobros";
import { obtenerContexto } from "@/lib/sesion";
import { VentasLista } from "./VentasLista";

export const metadata: Metadata = { title: "Ventas" };

export default async function Ventas() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;

  const esGerente = ctx.rol === "gerente";
  const [lista, productos, miembros, clientes, planes] = await Promise.all([
    oportunidades(ctx.empresa.id),
    productosActivos(ctx.empresa.id),
    ctx.rol === "gerente" ? miembrosActivos(ctx.empresa.id) : Promise.resolve([]),
    clientesCortos(ctx.empresa.id),
    esGerente ? planesActivos(ctx.empresa.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-titulo text-grande leading-tight">Ventas</h1>
        <p className="text-tinta-suave">
          {ctx.rol === "gerente" ? "Todas las ventas de la empresa, por etapa." : "Tus ventas, por etapa."}
        </p>
      </header>
      <VentasLista
        oportunidades={lista}
        productos={productos}
        miembros={miembros}
        esGerente={ctx.rol === "gerente"}
        quien={ctx.nombre.split(" ")[0]!}
        gerencia={esGerente ? { planes, miembros } : undefined}
      />
      <AnotarVisita clientes={clientes} productos={productos} />
      <OfrecerRecorrido id="ventas" />
    </div>
  );
}
