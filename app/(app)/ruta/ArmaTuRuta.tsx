"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, MapPinned } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { crearRuta } from "@/lib/acciones/mapa";
import type { ClienteCorto } from "@/lib/datos";
import { PegarLugares } from "./RutaVista";

/** Sin ruta para hoy (o vacía): "Arma tu ruta" con un nombre de zona y los lugares pegados. */
export function ArmaTuRuta({ nombreActual }: { nombreActual: string | null; clientes: ClienteCorto[] }) {
  const avisar = useAvisar();
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreActual ?? "");
  const [pegando, setPegando] = useState(false);
  const [pendiente, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-5" data-testid="arma-tu-ruta">
      <header>
        <h1 className="font-titulo text-grande leading-tight">Ruta del día</h1>
        <p className="text-tinta-suave">Arma tu ruta: la zona y los negocios que vas a visitar.</p>
      </header>
      <Tarjeta titulo="Arma tu ruta">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await crearRuta(nombre);
              if (!r.ok) return avisar(r.error, "error");
              setPegando(true);
            });
          }}
        >
          <Campo etiqueta="¿Por dónde sales? (la zona)" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Chapinero · Cra 13" required />
          <Boton type="submit" disabled={pendiente} icono={<MapPinned size={20} strokeWidth={1.75} aria-hidden />}>
            {nombreActual ? "Seguir" : "Crear la ruta"}
          </Boton>
        </form>
        <p className="mt-3 text-chico text-tinta-suave">
          También puedes agregar negocios desde el mapa de Ventas con «Agregar a la ruta de hoy».
        </p>
      </Tarjeta>
      <Boton variante="secundario" onClick={() => setPegando(true)} icono={<ClipboardList size={20} strokeWidth={1.75} aria-hidden />} className="self-start">
        Pegar lugares
      </Boton>
      {pegando && (
        <PegarLugares
          alCerrar={() => {
            setPegando(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
