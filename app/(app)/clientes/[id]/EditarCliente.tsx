"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { editarCliente } from "@/lib/acciones/clientes";
import type { ClienteFicha } from "@/lib/datos";
import { mostrarWhatsapp } from "@/lib/dominio/whatsapp";

const ORIGENES = [
  ["visita", "Visita"],
  ["conocido", "Conocido"],
  ["referido", "Referido"],
  ["instagram", "Instagram"],
  ["otro", "Otro"],
] as const;

export function EditarCliente({ cliente }: { cliente: ClienteFicha }) {
  const avisar = useAvisar();
  const [abierta, setAbierta] = useState(false);
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <Boton variante="secundario" onClick={() => setAbierta(true)} icono={<Pencil size={20} strokeWidth={1.75} aria-hidden />}>
        Editar
      </Boton>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Editar negocio">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const t = (k: string) => String(f.get(k) ?? "");
            iniciar(async () => {
              const r = await editarCliente({
                id: cliente.id,
                nombre_negocio: t("nombre_negocio"),
                tipo_negocio: t("tipo_negocio"),
                direccion: t("direccion"),
                barrio: t("barrio"),
                contacto_nombre: t("contacto_nombre"),
                contacto_whatsapp: t("contacto_whatsapp"),
                instagram: t("instagram"),
                origen: t("origen") as (typeof ORIGENES)[number][0],
                notas: t("notas"),
              });
              if (!r.ok) return setError(r.error);
              setError(undefined);
              avisar("Datos guardados");
              setAbierta(false);
            });
          }}
        >
          <Campo etiqueta="Nombre del negocio" name="nombre_negocio" defaultValue={cliente.nombre_negocio} required />
          <Campo etiqueta="Tipo de negocio" name="tipo_negocio" placeholder="Cafetería" defaultValue={cliente.tipo_negocio ?? ""} />
          <Campo etiqueta="Dueño o contacto" name="contacto_nombre" defaultValue={cliente.contacto_nombre ?? ""} />
          <Campo
            etiqueta="WhatsApp"
            name="contacto_whatsapp"
            inputMode="tel"
            placeholder="320 487 1882"
            defaultValue={mostrarWhatsapp(cliente.contacto_whatsapp) ?? ""}
          />
          <Campo etiqueta="Dirección" name="direccion" defaultValue={cliente.direccion ?? ""} />
          <Campo etiqueta="Barrio" name="barrio" defaultValue={cliente.barrio ?? ""} />
          <Campo etiqueta="Instagram" name="instagram" placeholder="@cafeluna" defaultValue={cliente.instagram ?? ""} />
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">¿Cómo llegó?</span>
            <select
              name="origen"
              defaultValue={cliente.origen}
              className="min-h-12 rounded-control border border-borde bg-superficie px-4"
            >
              {ORIGENES.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Notas</span>
            <textarea
              name="notas"
              rows={3}
              defaultValue={cliente.notas ?? ""}
              className="rounded-control border border-borde bg-superficie px-4 py-3 focus:outline-2 focus:outline-tinta"
            />
          </label>
          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}
          <Boton type="submit" ancho disabled={pendiente}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
        </form>
      </Hoja>
    </>
  );
}
