import type { Metadata } from "next";
import { Logo } from "@/components/marca/Logo";
import { APP, MAMUT_HERD_URL, WEB_PUBLICADA, marca } from "@/lib/marca";

export const metadata: Metadata = { title: "Acerca de" };

// GUIA-DE-USO.md → Apps: sello apilado debajo del nombre y la versión, con el texto corto y el contacto.
export default function Acerca() {
  const sello = <Logo logo="sello-apilado" alto={72} />;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
      <div>
        <h1 className="font-titulo text-grande leading-tight">{APP.nombre}</h1>
        <p className="text-tinta-suave">Versión {APP.version}</p>
      </div>

      {WEB_PUBLICADA ? (
        <a href={MAMUT_HERD_URL} target="_blank" rel="noopener noreferrer" className="p-2">
          {sello}
        </a>
      ) : (
        <div className="p-2">{sello}</div>
      )}

      <p>{APP.acercaDe}</p>

      <dl className="w-full divide-y divide-borde rounded-tarjeta border border-borde bg-superficie text-left">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-tinta-suave">Correo</dt>
          <dd>
            <a className="font-semibold underline underline-offset-4" href={`mailto:${marca.correo}`}>
              {marca.correo}
            </a>
          </dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-tinta-suave">WhatsApp</dt>
          <dd>
            <a
              className="font-semibold underline underline-offset-4"
              href={marca.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {marca.whatsapp}
            </a>
          </dd>
        </div>
      </dl>

      <p className="text-chico text-tinta-suave">{marca.derechos}</p>
    </div>
  );
}
