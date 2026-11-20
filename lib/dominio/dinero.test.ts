import { describe, expect, it } from "vitest";
import { formatearPesos, leerPesos } from "./dinero";

// Intl puede usar espacio normal o de no separación después del "$".
const normal = (s: string) => s.replace(/\s/g, " ");

describe("formatearPesos", () => {
  it("muestra 200000 como $ 200.000 o $200.000", () => {
    expect(["$ 200.000", "$200.000"]).toContain(normal(formatearPesos(200000)));
  });

  it("muestra cero y millones sin decimales", () => {
    expect(normal(formatearPesos(0))).toMatch(/^\$ ?0$/);
    expect(normal(formatearPesos(1500000))).toMatch(/^\$ ?1\.500\.000$/);
  });

  it("no acepta decimales", () => {
    expect(() => formatearPesos(100.5)).toThrow();
  });
});

describe("leerPesos", () => {
  it("entiende lo que escribe la gente", () => {
    expect(leerPesos("200.000")).toBe(200000);
    expect(leerPesos("$ 1.500.000")).toBe(1500000);
    expect(leerPesos("35000")).toBe(35000);
  });

  it("rechaza lo que no son pesos enteros", () => {
    expect(leerPesos("12,5")).toBeNull();
    expect(leerPesos("abc")).toBeNull();
    expect(leerPesos("")).toBeNull();
  });
});
