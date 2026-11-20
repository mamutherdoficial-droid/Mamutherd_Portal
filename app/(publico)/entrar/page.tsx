import type { Metadata } from "next";
import { Logo } from "@/components/marca/Logo";
import { rutaSegura } from "@/lib/rutas";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { siguiente } = await searchParams;
  const destino = rutaSegura(typeof siguiente === "string" ? siguiente : undefined);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <Logo logo="horizontal" alto={56} />
        <h1 className="font-titulo text-grande leading-tight">Portal Mamut</h1>
      </div>

      <FormEntrar siguiente={destino} />

      <aside className="rounded-tarjeta border border-borde bg-superficie p-4 text-tinta-suave">
        <p className="font-semibold text-tinta">¿Te invitaron al equipo?</p>
        <p>Abre el enlace que te llegó por WhatsApp y crea tu contraseña.</p>
      </aside>
    </div>
  );
}
