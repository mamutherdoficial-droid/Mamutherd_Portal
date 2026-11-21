"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Hoja } from "@/components/ui/Hoja";
import { crearMiembro } from "@/lib/acciones/equipo";

const FORMAS = [
  ["comision", "Comisión"],
  ["por_trabajo", "Por trabajo"],
  ["fijo", "Fijo"],
  ["ninguno", "Sin pago"],
] as const;

export function AgregarPersona() {
  const avisar = useAvisar();
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [rol, setRol] = useState<"ayudante" | "gerente">("ayudante");
  const [forma, setForma] = useState<(typeof FORMAS)[number][0]>("comision");
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <Boton onClick={() => setAbierta(true)} data-recorrido="equipo-agregar" icono={<UserPlus size={20} strokeWidth={1.75} aria-hidden />}>
        Agregar persona
      </Boton>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Nueva persona del equipo">
        <form
          className="flex flex-col gap-4"
          data-testid="form-persona"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            iniciar(async () => {
              const r = await crearMiembro({
                nombre: String(f.get("nombre") ?? ""),
                whatsapp: String(f.get("whatsapp") ?? ""),
                correo: String(f.get("correo") ?? ""),
                rol,
                forma_pago: forma,
              });
              if (!r.ok) return setError(r.error);
              avisar(r.mensaje ?? "Listo");
              setAbierta(false);
              if (r.datos?.id) router.push(`/equipo/${r.datos.id}`);
            });
          }}
        >
          <Campo etiqueta="Nombre" name="nombre" required autoComplete="off" />
          <Campo etiqueta="WhatsApp" name="whatsapp" inputMode="tel" placeholder="320 487 1882" />
          <Campo etiqueta="Correo" name="correo" type="email" inputMode="email" ayuda="Con este correo crea su cuenta al aceptar la invitación." />
          <fieldset>
            <legend className="mb-2 font-semibold">Rol</legend>
            <div className="flex flex-wrap gap-2">
              <Chip seleccionado={rol === "ayudante"} onClick={() => setRol("ayudante")}>
                Ayudante
              </Chip>
              <Chip seleccionado={rol === "gerente"} onClick={() => setRol("gerente")}>
                Gerente
              </Chip>
            </div>
            <p className="mt-1 text-chico text-tinta-suave">
              {rol === "ayudante" ? "Ve solo lo suyo: sus ventas, comisiones y tareas. Nunca cobros." : "Ve y cambia todo, cobros incluidos."}
            </p>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-semibold">¿Cómo se le paga?</legend>
            <div className="flex flex-wrap gap-2">
              {FORMAS.map(([v, t]) => (
                <Chip key={v} seleccionado={forma === v} onClick={() => setForma(v)}>
                  {t}
                </Chip>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}
          <Boton type="submit" ancho disabled={pendiente}>
            {pendiente ? "Guardando…" : "Agregar al equipo"}
          </Boton>
        </form>
      </Hoja>
    </>
  );
}
