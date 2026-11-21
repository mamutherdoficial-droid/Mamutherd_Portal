import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HandCoins } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { Estado } from "@/components/ui/Chip";
import { Dinero } from "@/components/ui/Dinero";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Vacio } from "@/components/ui/Vacio";
import { comisionesDe } from "@/lib/datos-cobros";
import { NOMBRE_CONCEPTO } from "@/lib/dominio/cobros";
import { fechaLarga } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mis comisiones" };

// Ayudante: solo sus comisiones (RLS). Nunca montos de cobros ni pagos de clientes.
export default async function MisComisiones() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  if (ctx.rol === "gerente") redirect("/equipo");

  const comisiones = await comisionesDe(ctx.empresa.id, ctx.miembroId);
  const debemos = comisiones.filter((k) => k.estado === "pendiente").reduce((s, k) => s + k.valor, 0);
  const pagado = comisiones.filter((k) => k.estado === "pagada").reduce((s, k) => s + k.valor, 0);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-titulo text-grande leading-tight">Mis comisiones</h1>
        <p className="text-tinta-suave">Tu comisión aparece cuando el negocio paga, no antes.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2" data-recorrido="comisiones-totales">
        <Tarjeta titulo="Te debemos" data-testid="te-debemos">
          <Dinero pesos={debemos} tamano="grande" />
        </Tarjeta>
        <Tarjeta titulo="Ya te pagamos">
          <Dinero pesos={pagado} tamano="grande" />
        </Tarjeta>
      </div>

      {comisiones.length === 0 ? (
        <Vacio
          icono={HandCoins}
          titulo="Aún no tienes comisiones"
          texto="Cuando un negocio que vendiste pague, aquí ves tu parte."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-borde rounded-tarjeta border border-borde bg-superficie px-4" data-recorrido="comisiones-lista">
          {comisiones.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 py-3" data-testid="comision">
              <div className="min-w-0">
                <p className="truncate font-semibold">{k.negocio}</p>
                <p className="text-chico text-tinta-suave">
                  {NOMBRE_CONCEPTO[k.concepto] ?? k.concepto} · {fechaLarga(k.creado_en.slice(0, 10)).toLowerCase()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Dinero pesos={k.valor} className="!text-base" />
                <Estado estado={k.estado === "pagada" ? "bien" : "alerta"}>{k.estado === "pagada" ? "Pagada" : "Por pagar"}</Estado>
              </div>
            </li>
          ))}
        </ul>
      )}
      <OfrecerRecorrido id="mis-comisiones" />
    </div>
  );
}
