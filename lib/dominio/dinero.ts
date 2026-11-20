// Dinero = pesos colombianos enteros (CLAUDE.md, regla 2). Nada de decimales.

const formato = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea pesos enteros: formatearPesos(200000) → "$ 200.000" (el espacio lo decide es-CO). */
export function formatearPesos(pesos: number): string {
  if (!Number.isSafeInteger(pesos)) {
    throw new Error(`El dinero va en pesos enteros; llegó ${pesos}`);
  }
  return formato.format(pesos);
}

/** Lee lo que alguien escribe ("200.000", "$ 1.500.000", "35000") y lo vuelve pesos enteros. */
export function leerPesos(texto: string): number | null {
  const limpio = texto.replace(/[$\s.]/g, "");
  if (!/^\d+$/.test(limpio)) return null;
  const valor = Number(limpio);
  return Number.isSafeInteger(valor) ? valor : null;
}
