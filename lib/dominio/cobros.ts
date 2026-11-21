// Reglas puras de cobros. Las comisiones NO se calculan aquí: las crea la base (trigger generar_comisiones).

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

/** Anticipo sugerido: la mitad, en pesos enteros (redondea hacia abajo a mil). */
export function anticipoSugerido(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  return Math.floor(valor / 2 / 1000) * 1000;
}

/** "2026-12-01" → "diciembre". */
export function nombreMes(dia: string): string {
  const mes = Number(dia.slice(5, 7));
  return MESES[mes - 1] ?? "";
}

/** Primer día del mes de un día ("2026-11-20" → "2026-11-01"). */
export function inicioMes(dia: string): string {
  return `${dia.slice(0, 7)}-01`;
}

/** Primer día del mes siguiente ("2026-12-20" → "2027-01-01"). */
export function mesSiguiente(dia: string): string {
  const a = Number(dia.slice(0, 4));
  const m = Number(dia.slice(5, 7));
  return m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, "0")}-01`;
}

export type EstadoCobro = "pendiente" | "parcial" | "pagado" | "vencido" | "anulado";

/** En qué pestaña de /cobros va un cobro. */
export function pestanaDe(estado: EstadoCobro): "por-cobrar" | "vencidos" | "pagados" | null {
  if (estado === "vencido") return "vencidos";
  if (estado === "pagado") return "pagados";
  if (estado === "pendiente" || estado === "parcial") return "por-cobrar";
  return null; // anulado: no se muestra
}

export const NOMBRE_CONCEPTO: Record<string, string> = {
  instalacion: "Instalación",
  mensualidad: "Mensualidad",
  fotos: "Fotos",
  piloto: "Piloto",
  otro: "Otro",
};

export const MEDIOS_PAGO = [
  ["nequi", "Nequi"],
  ["bancolombia", "Bancolombia"],
  ["efectivo", "Efectivo"],
  ["otro", "Otro"],
] as const;
export type MedioPago = (typeof MEDIOS_PAGO)[number][0];
