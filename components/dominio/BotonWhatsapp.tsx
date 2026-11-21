"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Boton } from "@/components/ui/Boton";
import { Hoja } from "@/components/ui/Hoja";
import { enlaceWhatsapp, mensajeSeguimiento, mostrarWhatsapp } from "@/lib/dominio/whatsapp";

type Props = {
  whatsapp: string | null;
  contacto: string | null;
  negocio: string;
  producto: string;
  quien: string;
  compacto?: boolean;
  /** Otro mensaje (p. ej. recordatorio de cobro); si no, el de seguimiento. */
  mensajeInicial?: string;
};

/** WhatsApp sin API (D-006): el mensaje se escribe aquí, se puede editar y se abre WhatsApp para enviarlo. */
export function BotonWhatsapp({ whatsapp, contacto, negocio, producto, quien, compacto, mensajeInicial }: Props) {
  const [abierta, setAbierta] = useState(false);
  const [mensaje, setMensaje] = useState(() => mensajeInicial ?? mensajeSeguimiento({ contacto, negocio, producto, quien }));
  const numero = mostrarWhatsapp(whatsapp);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label={`WhatsApp a ${negocio}`}
        title="Escribir por WhatsApp"
        className={
          compacto
            ? "grid size-12 shrink-0 place-items-center rounded-control border border-borde text-bien hover:bg-suave"
            : "inline-flex min-h-12 items-center gap-2 rounded-control border border-borde px-4 font-semibold text-bien hover:bg-suave"
        }
      >
        <MessageCircle size={20} strokeWidth={1.75} aria-hidden />
        {!compacto && "WhatsApp"}
      </button>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo={`WhatsApp a ${negocio}`}>
        <div className="flex flex-col gap-4">
          <p className="text-tinta-suave">
            {numero ? `Para ${contacto ?? "el negocio"} · ${numero}` : "Este negocio no tiene WhatsApp guardado: elige el chat al abrir."}
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Mensaje</span>
            <textarea
              rows={5}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="rounded-control border border-borde bg-superficie px-4 py-3 focus:outline-2 focus:outline-tinta"
            />
          </label>
          <Boton
            ancho
            icono={<MessageCircle size={20} strokeWidth={1.75} aria-hidden />}
            onClick={() => {
              window.open(enlaceWhatsapp(whatsapp, mensaje), "_blank", "noopener,noreferrer");
              setAbierta(false);
            }}
          >
            Abrir WhatsApp
          </Boton>
        </div>
      </Hoja>
    </>
  );
}
