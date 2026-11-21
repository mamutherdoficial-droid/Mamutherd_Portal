"use client";
import { useTransition } from "react";
import { CalendarPlus } from "lucide-react";
import { Hotspot } from "@/components/recorrido/Hotspot";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { generarMensualidades } from "@/lib/acciones/cobros";
import { nombreMes } from "@/lib/dominio/cobros";

/** "Generar mensualidades de diciembre": idempotente; la segunda vez dice "Ya estaban creadas". */
export function GenerarMensualidades({ mes, yaGeneradas }: { mes: string; yaGeneradas: boolean }) {
  const avisar = useAvisar();
  const [pendiente, iniciar] = useTransition();
  return (
    <div className="relative" data-recorrido="cobros-mensualidades">
      <Boton
        variante={yaGeneradas ? "secundario" : "principal"}
        disabled={pendiente}
        icono={<CalendarPlus size={20} strokeWidth={1.75} aria-hidden />}
        onClick={() =>
          iniciar(async () => {
            const r = await generarMensualidades(mes);
            avisar(r.ok ? (r.mensaje ?? "Listo") : r.error, r.ok ? "bien" : "error");
          })
        }
      >
        {pendiente ? "Generando…" : `Generar mensualidades de ${nombreMes(mes)}`}
      </Boton>
      <Hotspot
        id="hotspot-mensualidades"
        version={1}
        titulo="Nuevo: mensualidades del mes"
        texto="El día 1 toca aquí: crea el cobro de cada cliente con plan mensual. Si lo tocas dos veces no se duplica."
      />
    </div>
  );
}
