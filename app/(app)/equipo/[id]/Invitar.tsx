"use client";
import { useState, useTransition } from "react";
import { Copy, Send } from "lucide-react";
import { BotonWhatsapp } from "@/components/dominio/BotonWhatsapp";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { invitar } from "@/lib/acciones/equipo";

/** "Invitar": crea un enlace de un solo uso (vence en 7 días) y lo deja listo para WhatsApp. */
export function Invitar({
  miembroId,
  nombre,
  whatsapp,
  empresa,
  quien,
  hayVigente,
}: {
  miembroId: string;
  nombre: string;
  whatsapp: string | null;
  empresa: string;
  quien: string;
  hayVigente: boolean;
}) {
  const avisar = useAvisar();
  const [enlace, setEnlace] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const mensaje = enlace
    ? `Hola ${nombre.split(" ")[0]}, te habla ${quien}. Te invito al portal de ${empresa}: ahí anotas tus visitas y ves tus comisiones. Abre este enlace y crea tu contraseña (vence en 7 días): ${enlace}`
    : "";

  return (
    <div className="flex flex-col gap-3" data-recorrido="equipo-invitar">
      <p className="text-tinta-suave">
        {hayVigente && !enlace
          ? "Ya hay una invitación sin usar. Si creas otra, la anterior deja de servir."
          : "Crea un enlace de un solo uso para que entre con su propia contraseña."}
      </p>
      {!enlace ? (
        <Boton
          disabled={pendiente}
          icono={<Send size={20} strokeWidth={1.75} aria-hidden />}
          onClick={() =>
            iniciar(async () => {
              const r = await invitar(miembroId);
              if (!r.ok || !r.datos) return avisar(r.ok ? "No pudimos crear el enlace." : r.error, "error");
              setEnlace(r.datos.enlace);
            })
          }
        >
          {pendiente ? "Creando enlace…" : "Invitar al portal"}
        </Boton>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="break-all rounded-control bg-suave px-3 py-2 font-mono text-chico" data-testid="enlace-invitacion">
            {enlace}
          </p>
          <div className="flex flex-wrap gap-2">
            <BotonWhatsapp whatsapp={whatsapp} contacto={nombre} negocio={nombre} producto="" quien={quien} mensajeInicial={mensaje} />
            <Boton
              variante="secundario"
              icono={<Copy size={20} strokeWidth={1.75} aria-hidden />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(enlace);
                  avisar("Enlace copiado");
                } catch {
                  avisar("No se pudo copiar: selecciónalo y cópialo a mano.", "error");
                }
              }}
            >
              Copiar enlace
            </Boton>
          </div>
          <p className="text-chico text-tinta-suave">Sirve una sola vez y vence en 7 días.</p>
        </div>
      )}
    </div>
  );
}
