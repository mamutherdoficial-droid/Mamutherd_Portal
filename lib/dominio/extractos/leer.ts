// Lector de extractos (Fase 4b, D-017). Puro y testeable: recibe filas (de un CSV o de un .xlsx)
// y devuelve los INGRESOS con fecha, descripción, referencia, valor en pesos enteros y su huella.
// No asume un formato fijo: busca la fila de títulos (Fecha, Descripción, Valor/Crédito, Referencia).

export type Banco = "bancolombia" | "nequi" | "otro";
export type Celda = string | number | Date | boolean | null | undefined;

export type MovimientoLeido = {
  fecha: string; // AAAA-MM-DD
  descripcion: string;
  referencia: string | null;
  valor: number; // pesos enteros, > 0
  huella: string;
};

export type Lectura = { movimientos: MovimientoLeido[]; salidas: number; descartadas: number };

/** Quita tildes, pasa a minúsculas y deja solo letras, números y espacios. */
export function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Lee montos colombianos o gringos a pesos enteros:
 * "$ 1.500.000,00" → 1500000 · "1,500,000.00" → 1500000 · "-50.000" → -50000 · 35000 → 35000.
 */
export function leerMonto(v: Celda): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : null;
  if (typeof v !== "string") return null;
  let t = v.replace(/[$\s]|COP/gi, ""); // \s incluye el espacio duro (U+00A0)
  if (!t) return null;
  let negativo = false;
  if (/^\(.*\)$/.test(t)) {
    negativo = true;
    t = t.slice(1, -1);
  }
  if (t.startsWith("-")) {
    negativo = true;
    t = t.slice(1);
  } else if (t.startsWith("+")) t = t.slice(1);
  if (!/^[\d.,]+$/.test(t)) return null;
  const ultPunto = t.lastIndexOf(".");
  const ultComa = t.lastIndexOf(",");
  let entero: string;
  let decimales = "";
  if (ultPunto >= 0 && ultComa >= 0) {
    const sep = Math.max(ultPunto, ultComa);
    entero = t.slice(0, sep).replace(/[.,]/g, "");
    decimales = t.slice(sep + 1);
  } else if (ultComa >= 0 || ultPunto >= 0) {
    const sep = ultComa >= 0 ? "," : ".";
    const partes = t.split(sep);
    const ultima = partes[partes.length - 1]!;
    // Un solo separador con 1–2 dígitos al final = decimales; si no, separador de miles.
    if (partes.length === 2 && ultima.length <= 2) {
      entero = partes[0]!;
      decimales = ultima;
    } else {
      entero = partes.join("");
    }
  } else {
    entero = t;
  }
  if (!/^\d+$/.test(entero || "0")) return null;
  const n = Math.round(Number(`${entero || "0"}.${decimales || "0"}`));
  if (!Number.isSafeInteger(n)) return null;
  return negativo ? -n : n;
}

const dos = (n: number) => String(n).padStart(2, "0");

/** "2026/11/20", "2026-11-20", "20/11/2026", "20-11-26", serial de Excel o Date → "2026-11-20". */
export function leerFecha(v: Celda): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getUTCFullYear()}-${dos(v.getUTCMonth() + 1)}-${dos(v.getUTCDate())}`;
  }
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Serial de Excel (días desde 1899-12-30).
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86_400_000);
    return leerFecha(d);
  }
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, 10);
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return valida(Number(m[1]), Number(m[2]), Number(m[3]));
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    const anio = m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return valida(anio, Number(m[2]), Number(m[1])); // en Colombia: día/mes/año
  }
  return null;
}

function valida(a: number, m: number, d: number): string | null {
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return null;
  return `${a}-${dos(m)}-${dos(d)}`;
}

type Columnas = { fecha: number; descripcion: number; referencia: number; valor: number; credito: number; debito: number };

function buscarColumnas(fila: Celda[]): Columnas | null {
  const t = fila.map((c) => normalizar(String(c ?? "")));
  const idx = (re: RegExp) => t.findIndex((x) => re.test(x));
  const fecha = idx(/^fecha/);
  const valor = idx(/^(valor|monto|importe)(\s|$)/);
  const credito = idx(/^(credito|creditos|abono|abonos|entrada|ingreso)/);
  const debito = idx(/^(debito|debitos|cargo|salida|egreso)/);
  if (fecha < 0 || (valor < 0 && credito < 0)) return null;
  return {
    fecha,
    descripcion: idx(/^(descripcion|detalle|concepto|movimiento|transaccion)/),
    referencia: idx(/^(referencia|dcto|documento|ref|comprobante|numero)/),
    valor,
    credito,
    debito,
  };
}

/** Huella estable de un movimiento (fecha, valor, descripción, referencia y repetición en el archivo). */
export async function huella(banco: Banco, m: Omit<MovimientoLeido, "huella">, repeticion: number): Promise<string> {
  const texto = [banco, m.fecha, m.valor, normalizar(m.descripcion), normalizar(m.referencia ?? ""), repeticion].join("|");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Lee las filas de un extracto. Devuelve solo ingresos; cuenta las salidas y las filas que no se entendieron. */
export async function leerFilas(filas: Celda[][], banco: Banco): Promise<Lectura> {
  let cols: Columnas | null = null;
  let inicio = 0;
  for (let i = 0; i < Math.min(filas.length, 30); i++) {
    cols = buscarColumnas(filas[i] ?? []);
    if (cols) {
      inicio = i + 1;
      break;
    }
  }
  if (!cols) throw new Error("No encontramos la fila de títulos (Fecha y Valor) en el archivo.");

  const leidos: Omit<MovimientoLeido, "huella">[] = [];
  let salidas = 0;
  let descartadas = 0;
  for (const fila of filas.slice(inicio)) {
    if (!fila || fila.every((c) => c == null || String(c).trim() === "")) continue;
    const fecha = leerFecha(fila[cols.fecha]);
    let valor: number | null;
    if (cols.credito >= 0) {
      const cr = leerMonto(fila[cols.credito]) ?? 0;
      const db = cols.debito >= 0 ? (leerMonto(fila[cols.debito]) ?? 0) : 0;
      valor = cr !== 0 ? Math.abs(cr) : db !== 0 ? -Math.abs(db) : null;
    } else {
      valor = leerMonto(fila[cols.valor]);
    }
    if (!fecha || valor == null) {
      descartadas++;
      continue;
    }
    if (valor <= 0) {
      salidas++;
      continue;
    }
    leidos.push({
      fecha,
      valor,
      descripcion: cols.descripcion >= 0 ? String(fila[cols.descripcion] ?? "").trim().slice(0, 300) : "",
      referencia: cols.referencia >= 0 && fila[cols.referencia] != null && String(fila[cols.referencia]).trim() !== "" ? String(fila[cols.referencia]).trim().slice(0, 120) : null,
    });
  }

  // Filas idénticas dentro del mismo archivo son pagos distintos: se numeran.
  const vistas = new Map<string, number>();
  const movimientos: MovimientoLeido[] = [];
  for (const m of leidos) {
    const clave = [m.fecha, m.valor, normalizar(m.descripcion), normalizar(m.referencia ?? "")].join("|");
    const n = (vistas.get(clave) ?? 0) + 1;
    vistas.set(clave, n);
    movimientos.push({ ...m, huella: await huella(banco, m, n) });
  }
  return { movimientos, salidas, descartadas };
}

/** CSV simple con comillas; detecta si el separador es coma o punto y coma. */
export function leerCsv(texto: string): string[][] {
  const limpio = texto.replace(/^\uFEFF/, ""); // BOM de Excel
  const primera = limpio.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i]!;
    if (comillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else celda += c;
  }
  if (celda !== "" || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}
