// Propuesta de coincidencias entre un movimiento del banco y los cobros pendientes (Fase 4b).
// Solo PROPONE: el gerente confirma (D-017).
import { normalizar } from "./leer";

export type CobroPendiente = { id: string; saldo: number; cliente: string; contacto: string | null; concepto: string };
export type Propuesta = {
  tipo: "valor-y-nombre" | "solo-valor" | "sin-coincidencia";
  cobro: CobroPendiente | null;
  /** Otros cobros con el mismo valor (para elegir si la propuesta no es la correcta). */
  otros: CobroPendiente[];
};

export const TEXTO_PROPUESTA: Record<Propuesta["tipo"], string> = {
  "valor-y-nombre": "Coincide valor y nombre",
  "solo-valor": "Mismo valor, revisa el nombre",
  "sin-coincidencia": "Sin coincidencia",
};

const VACIAS = new Set(["de", "la", "el", "los", "las", "del", "y", "sas", "sa", "ltda", "pago", "transferencia", "nequi", "bancolombia", "abono", "trf", "recibido", "desde", "para", "por"]);

function palabras(t: string): string[] {
  return normalizar(t)
    .split(" ")
    .filter((p) => p.length >= 3 && !VACIAS.has(p) && !/^\d+$/.test(p));
}

/** ¿La descripción del banco menciona el negocio o el contacto? (alguna palabra significativa en común). */
export function parecidoNombre(descripcion: string, c: CobroPendiente): boolean {
  const d = new Set(palabras(descripcion));
  if (d.size === 0) return false;
  return [...palabras(c.cliente), ...palabras(c.contacto ?? "")].some((p) => d.has(p));
}

export function proponer(mov: { valor: number; descripcion: string }, cobros: CobroPendiente[]): Propuesta {
  const mismoValor = cobros.filter((c) => c.saldo === mov.valor);
  const conNombre = mismoValor.filter((c) => parecidoNombre(mov.descripcion, c));
  if (conNombre.length > 0) {
    return { tipo: "valor-y-nombre", cobro: conNombre[0]!, otros: mismoValor.filter((c) => c.id !== conNombre[0]!.id) };
  }
  if (mismoValor.length > 0) {
    return { tipo: "solo-valor", cobro: mismoValor[0]!, otros: mismoValor.slice(1) };
  }
  return { tipo: "sin-coincidencia", cobro: null, otros: [] };
}
