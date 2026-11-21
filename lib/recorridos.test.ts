import { describe, expect, it } from "vitest";
import { RECORRIDOS, bienvenidaDe } from "./recorridos";

describe("tutorial guiado", () => {
  const deAyudante = RECORRIDOS.filter((r) => r.roles.includes("ayudante"));

  it("ningún recorrido de la ayudante habla de cobros ni señala la sección de Cobros", () => {
    for (const r of deAyudante) {
      for (const p of r.pasos) {
        expect(`${p.titulo} ${p.texto}`, `${r.id}: ${p.titulo}`).not.toMatch(/cobro|cobrar|saldo|mensualidad/i);
        expect(p.objetivo ?? "", `${r.id}: ${p.titulo}`).not.toMatch(/^cobros/);
      }
    }
  });

  it("la ayudante tiene su propia bienvenida", () => {
    expect(bienvenidaDe("ayudante").id).toBe("bienvenida-ayudante");
    expect(bienvenidaDe("gerente").id).toBe("bienvenida");
  });

  it("máximo 5 pasos por recorrido y frases cortas (≤ 15 palabras)", () => {
    for (const r of RECORRIDOS) {
      expect(r.pasos.length, r.id).toBeLessThanOrEqual(5);
      for (const p of r.pasos) expect(p.texto.split(/\s+/).length, `${r.id}: ${p.texto}`).toBeLessThanOrEqual(15);
    }
  });

  it("ids únicos", () => {
    const ids = RECORRIDOS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
