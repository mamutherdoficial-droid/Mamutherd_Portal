import { describe, expect, it } from "vitest";
import { avance, cumplida, valorMeta } from "./metas";

describe("metas", () => {
  it("avance entre 0 y 100", () => {
    expect(avance(5, 10)).toBe(50);
    expect(avance(15, 10)).toBe(100);
    expect(avance(0, 0)).toBe(100);
    expect(avance(1, 3)).toBe(33);
  });
  it("cumplida", () => {
    expect(cumplida(10, 10)).toBe(true);
    expect(cumplida(9, 10)).toBe(false);
  });
  it("ingresos en pesos, lo demás en número", () => {
    expect(valorMeta("visitas", 12)).toBe("12");
    expect(valorMeta("ingresos", 400000)).toMatch(/400\.000/);
  });
});
