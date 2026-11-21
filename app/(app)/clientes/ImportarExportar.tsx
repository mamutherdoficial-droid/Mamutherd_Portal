"use client";
import { useRef, useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { exportarClientes, importarClientes } from "@/lib/acciones/producto";

/** Gerente: importar clientes desde un CSV y exportarlos (queda registro, Ley 1581). */
export function ImportarExportar() {
  const avisar = useAvisar();
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  return (
    <details className="rounded-tarjeta border border-borde bg-superficie px-4 py-2" data-testid="importar-exportar">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold">Importar o exportar clientes</summary>
      <div className="flex flex-col gap-4 pb-3 pt-2">
        <form
          ref={form}
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const datos = new FormData(e.currentTarget);
            iniciar(async () => {
              const r = await importarClientes(datos);
              if (!r.ok) return setError(r.error);
              setError(undefined);
              form.current?.reset();
              avisar(r.mensaje ?? "Listo");
            });
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Importar desde un .csv</span>
            <span className="text-chico text-tinta-suave">Columnas: Negocio (obligatoria), Tipo, Dirección, Barrio, Contacto, WhatsApp, Instagram, Notas.</span>
            <input
              type="file"
              name="archivo"
              accept=".csv,text/csv"
              required
              className="min-h-12 rounded-control border border-borde bg-superficie px-3 py-2 file:mr-3 file:rounded-control file:border-0 file:bg-suave file:px-3 file:py-1.5 file:font-semibold"
            />
          </label>
          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}
          <Boton type="submit" variante="secundario" disabled={pendiente} icono={<Upload size={20} strokeWidth={1.75} aria-hidden />} className="self-start">
            {pendiente ? "Importando…" : "Importar clientes"}
          </Boton>
        </form>
        <div className="flex flex-col gap-2 border-t border-borde pt-3">
          <p className="text-chico text-tinta-suave">
            Los contactos son datos personales (Ley 1581): úsalos solo para la gestión comercial. Cada exportación queda registrada.
          </p>
          <Boton
            variante="fantasma"
            className="self-start"
            disabled={pendiente}
            icono={<Download size={20} strokeWidth={1.75} aria-hidden />}
            onClick={() =>
              iniciar(async () => {
                const r = await exportarClientes();
                if (!r.ok || !r.datos) return avisar(r.ok ? "No pudimos exportar." : r.error, "error");
                const url = URL.createObjectURL(new Blob([r.datos.csv], { type: "text/csv;charset=utf-8" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = r.datos.archivo;
                a.click();
                URL.revokeObjectURL(url);
                avisar(r.mensaje ?? "Exportado");
              })
            }
          >
            Exportar clientes (.csv)
          </Boton>
        </div>
      </div>
    </details>
  );
}
