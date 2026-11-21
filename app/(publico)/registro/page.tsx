import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { marca } from "@/lib/marca";
import { PLANTILLAS } from "@/lib/dominio/plantillas";
import { misEmpresas } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormRegistro } from "./FormRegistro";

export const metadata: Metadata = { title: "Crea tu empresa" };

/** Registro de empresa nueva (Fase 5). Cerrado por defecto: se abre con REGISTRO_ABIERTO=si (D-042). */
export default async function Registro() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);
  const yaGerente = conSesion && (await misEmpresas()).some((e) => e.rol === "gerente");
  const abierto = process.env.REGISTRO_ABIERTO === "si" || yaGerente;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <Logo logo="horizontal" alto={56} />
        <h1 className="font-titulo text-grande leading-tight">{yaGerente ? "Crea otra empresa" : "Crea tu empresa"}</h1>
      </div>
      {abierto ? (
        <FormRegistro conSesion={conSesion} plantillas={PLANTILLAS.map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion }))} />
      ) : (
        <div className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4" data-testid="registro-cerrado">
          <p className="font-semibold">El registro todavía no está abierto.</p>
          <p>Estamos probando el portal con pocos negocios. Si quieres usarlo, escríbenos:</p>
          <p>
            <a href={marca.whatsappUrl} className="font-semibold underline underline-offset-4" target="_blank" rel="noreferrer">
              WhatsApp {marca.whatsapp}
            </a>{" "}
            · {marca.correo}
          </p>
        </div>
      )}
      <Link href="/entrar" className="self-center font-semibold underline underline-offset-4">
        Ya tengo cuenta: entrar
      </Link>
    </div>
  );
}
