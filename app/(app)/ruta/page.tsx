import type { Metadata } from "next";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { clientesCortos, productosActivos } from "@/lib/datos";
import { rutaDelDia } from "@/lib/datos-mapa";
import { diaBogota, fechaLarga } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";
import { ArmaTuRuta } from "./ArmaTuRuta";
import { RutaVista } from "./RutaVista";

export const metadata: Metadata = { title: "Ruta del día" };

export default async function Ruta() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  const hoy = diaBogota();
  const [ruta, clientes, productos] = await Promise.all([
    rutaDelDia(ctx.empresa.id, ctx.miembroId, hoy),
    clientesCortos(ctx.empresa.id),
    productosActivos(ctx.empresa.id),
  ]);

  if (!ruta || ruta.paradas.length === 0) return <ArmaTuRuta nombreActual={ruta?.nombre ?? null} clientes={clientes} />;
  return (
    <>
      <RutaVista ruta={ruta} clientes={clientes} productos={productos} titulo={fechaLarga(hoy)} esHoy />
      <OfrecerRecorrido id="ruta" />
    </>
  );
}
