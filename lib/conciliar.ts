import "server-only";
import type { Revision } from "@/components/dominio/Conciliar";
import { cobrosLista, movimientosPorRevisar } from "@/lib/datos-cobros";
import { NOMBRE_CONCEPTO } from "@/lib/dominio/cobros";
import { proponer, type CobroPendiente } from "@/lib/dominio/extractos/coincidencias";

/** Lo que necesita el panel "Conciliar con el banco": cada ingreso por revisar con su propuesta. */
export async function datosConciliar(empresaId: string): Promise<{ revisiones: Revision[]; pendientes: CobroPendiente[] }> {
  const [movimientos, cobros] = await Promise.all([movimientosPorRevisar(empresaId), cobrosLista(empresaId)]);
  const pendientes: CobroPendiente[] = cobros
    .filter((c) => c.estado !== "pagado" && c.saldo > 0)
    .map((c) => ({
      id: c.id,
      saldo: c.saldo,
      cliente: c.cliente.nombre,
      contacto: c.cliente.contacto,
      concepto: c.descripcion || NOMBRE_CONCEPTO[c.concepto] || c.concepto,
    }));
  return { revisiones: movimientos.map((m) => ({ movimiento: m, propuesta: proponer(m, pendientes) })), pendientes };
}
