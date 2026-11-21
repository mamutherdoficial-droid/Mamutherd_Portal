// Reglas puras de metas (Fase 4).
import { formatearPesos } from "./dinero";

export const INDICADORES = ["visitas", "conversaciones_dueno", "clientes_nuevos", "ingresos"] as const;
export type Indicador = (typeof INDICADORES)[number];

export const NOMBRE_INDICADOR: Record<Indicador, string> = {
  visitas: "Visitas",
  conversaciones_dueno: "Con el dueño",
  clientes_nuevos: "Clientes nuevos",
  ingresos: "Ingresos",
};

/** Porcentaje de avance, entre 0 y 100 (objetivo 0 = cumplida). */
export function avance(logrado: number, objetivo: number): number {
  if (objetivo <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((logrado / objetivo) * 100)));
}

export function cumplida(logrado: number, objetivo: number): boolean {
  return logrado >= objetivo;
}

/** "12" o "$ 400.000" según el indicador. */
export function valorMeta(indicador: string, n: number): string {
  return indicador === "ingresos" ? formatearPesos(n) : String(n);
}
