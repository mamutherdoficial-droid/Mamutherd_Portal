import type { Metadata } from "next";
import { Logo } from "@/components/marca/Logo";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormUnirme } from "./FormUnirme";

export const metadata: Metadata = { title: "Unirme al equipo" };

/**
 * /unirme?token=… (D-014): la persona invitada crea su cuenta con SU contraseña y queda vinculada
 * a su lugar en el equipo con aceptar_invitacion. Sin service_role.
 */
export default async function Unirme({ searchParams }: PageProps<"/unirme">) {
  const { token } = await searchParams;
  const valido = typeof token === "string" && /^[0-9a-f]{64}$/.test(token);
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const correo = typeof data?.claims?.email === "string" ? data.claims.email : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <Logo logo="horizontal" alto={56} />
        <h1 className="font-titulo text-grande leading-tight">Únete al equipo</h1>
        <p className="text-tinta-suave">Crea tu contraseña y entra al Portal Mamut.</p>
      </div>
      {valido ? (
        <FormUnirme token={token} sesion={data?.claims?.sub ? { correo } : null} />
      ) : (
        <p role="alert" className="rounded-tarjeta border border-error/40 bg-error/10 p-4 font-semibold text-error">
          Este enlace no está completo. Pídele a quien te invitó que te lo mande otra vez.
        </p>
      )}
    </div>
  );
}
