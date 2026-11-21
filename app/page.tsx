import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Portada } from "@/components/portada/Portada";

export const metadata: Metadata = {
  title: "Portal Mamut · Ventas, cobros y equipo en un solo lugar",
  description: "Anota visitas, sigue tus ventas, cobra a tiempo y paga comisiones sin hacer cuentas a mano.",
};

/** "/": con sesión, a Hoy. Sin sesión, la portada pública (Fase 5, DESIGN.md → Landing pública). */
export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/hoy");
  return <Portada registroAbierto={process.env.REGISTRO_ABIERTO === "si"} />;
}
