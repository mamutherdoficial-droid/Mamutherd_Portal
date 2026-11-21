import { readFileSync } from "node:fs";
import readXlsxFile from "read-excel-file/node";
import { describe, expect, it } from "vitest";
import { parecidoNombre, proponer, type CobroPendiente } from "./coincidencias";
import { leerCsv, leerFecha, leerFilas, leerMonto, type Celda } from "./leer";

const ejemplo = (archivo: string) => `tests/fixtures/extractos/${archivo}`;

describe("montos y fechas", () => {
  it("lee montos colombianos y gringos a pesos enteros", () => {
    expect(leerMonto("$ 1.500.000,00")).toBe(1_500_000);
    expect(leerMonto("1,500,000.00")).toBe(1_500_000);
    expect(leerMonto("-50.000")).toBe(-50_000);
    expect(leerMonto("-$ 20.000")).toBe(-20_000);
    expect(leerMonto("(35.000)")).toBe(-35_000);
    expect(leerMonto("35000")).toBe(35_000);
    expect(leerMonto("120.000")).toBe(120_000);
    expect(leerMonto("1.234,5")).toBe(1235);
    expect(leerMonto(35000)).toBe(35_000);
    expect(leerMonto("abc")).toBeNull();
    expect(leerMonto("")).toBeNull();
  });

  it("lee fechas día/mes/año, año/mes/día, Date y serial de Excel", () => {
    expect(leerFecha("2026/11/20")).toBe("2026-11-20");
    expect(leerFecha("20/11/2026")).toBe("2026-11-20");
    expect(leerFecha("5-1-27")).toBe("2027-01-05");
    expect(leerFecha(new Date(Date.UTC(2026, 10, 23)))).toBe("2026-11-23");
    expect(leerFecha(46349)).toBe("2026-11-23");
    expect(leerFecha("31/02/2026")).toBeNull();
    expect(leerFecha("FIN")).toBeNull();
  });
});

describe("extractos de ejemplo", () => {
  it("Bancolombia .csv: solo ingresos, con fecha, valor y referencia", async () => {
    const { movimientos, salidas, descartadas } = await leerFilas(leerCsv(readFileSync(ejemplo("bancolombia.csv"), "utf8")), "bancolombia");
    expect(movimientos.map((m) => [m.fecha, m.valor, m.referencia])).toEqual([
      ["2026-11-20", 100_000, "123456"],
      ["2026-11-21", 35_000, "98765"],
      ["2026-11-21", 35_000, "98765"],
    ]);
    expect(movimientos[0]!.descripcion).toBe("TRANSFERENCIA DESDE NEQUI CAFE LUNA");
    expect(salidas).toBe(1);
    expect(descartadas).toBe(1); // "FIN DEL EXTRACTO"
    // Dos pagos idénticos el mismo día son dos movimientos distintos (huellas distintas).
    expect(new Set(movimientos.map((m) => m.huella)).size).toBe(3);
  });

  it("Nequi .csv con punto y coma, BOM, tildes y comillas", async () => {
    const { movimientos, salidas } = await leerFilas(leerCsv(readFileSync(ejemplo("nequi.csv"), "utf8")), "nequi");
    expect(movimientos.map((m) => [m.fecha, m.valor])).toEqual([
      ["2026-11-20", 120_000],
      ["2026-11-22", 55_000],
    ]);
    expect(movimientos[1]!.descripcion).toBe('Recibí de Café "El Roble"');
    expect(movimientos[0]!.referencia).toBe("M123");
    expect(salidas).toBe(1);
  });

  it("Bancolombia .xlsx con columnas Débito y Crédito y fechas de Excel", async () => {
    const filas = (await readXlsxFile(readFileSync(ejemplo("bancolombia.xlsx")))) as Celda[][];
    const { movimientos, salidas } = await leerFilas(filas, "bancolombia");
    expect(movimientos.map((m) => [m.fecha, m.valor, m.descripcion])).toEqual([
      ["2026-11-23", 100_000, "ABONO CAFE LUNA"],
      ["2026-11-24", 35_000, "ABONO HELADERIA POLO"],
    ]);
    expect(salidas).toBe(1);
  });

  it("el mismo archivo da las mismas huellas (subirlo dos veces no duplica)", async () => {
    const texto = readFileSync(ejemplo("bancolombia.csv"), "utf8");
    const a = await leerFilas(leerCsv(texto), "bancolombia");
    const b = await leerFilas(leerCsv(texto), "bancolombia");
    expect(a.movimientos.map((m) => m.huella)).toEqual(b.movimientos.map((m) => m.huella));
  });

  it("un archivo sin títulos explica qué pasa", async () => {
    await expect(leerFilas([["hola", "mundo"]], "otro")).rejects.toThrow(/fila de títulos/);
  });
});

describe("coincidencias", () => {
  const cobros: CobroPendiente[] = [
    { id: "a", saldo: 100_000, cliente: "Café Luna", contacto: "Luisa Gómez", concepto: "instalacion" },
    { id: "b", saldo: 100_000, cliente: "Heladería Polo", contacto: null, concepto: "instalacion" },
    { id: "c", saldo: 35_000, cliente: "Panadería El Trigal", contacto: null, concepto: "mensualidad" },
  ];

  it("valor y nombre", () => {
    const p = proponer({ valor: 100_000, descripcion: "TRANSFERENCIA DESDE NEQUI CAFE LUNA" }, cobros);
    expect(p.tipo).toBe("valor-y-nombre");
    expect(p.cobro?.id).toBe("a");
    expect(p.otros.map((c) => c.id)).toEqual(["b"]);
  });

  it("por el nombre del contacto", () => {
    expect(parecidoNombre("Recibí de LUISA GÓMEZ", cobros[0]!)).toBe(true);
  });

  it("mismo valor, nombre distinto", () => {
    const p = proponer({ valor: 35_000, descripcion: "ABONO TRANSFERENCIA" }, cobros);
    expect(p.tipo).toBe("solo-valor");
    expect(p.cobro?.id).toBe("c");
  });

  it("sin coincidencia", () => {
    expect(proponer({ valor: 999, descripcion: "X" }, cobros).tipo).toBe("sin-coincidencia");
  });

  it("las palabras de relleno no cuentan como coincidencia", () => {
    expect(parecidoNombre("PAGO TRANSFERENCIA NEQUI", cobros[1]!)).toBe(false);
  });
});
