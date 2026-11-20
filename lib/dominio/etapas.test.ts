import { describe, expect, it } from "vitest";
import { abierta, siguienteEtapa } from "./etapas";

describe("etapas", () => {
  it("avanza de a una hasta propuesta", () => {
    expect(siguienteEtapa("prospecto")).toBe("contactado");
    expect(siguienteEtapa("contactado")).toBe("demo");
    expect(siguienteEtapa("demo")).toBe("propuesta");
  });

  it("desde propuesta no ofrece ganada (la marca el gerente con el pago)", () => {
    expect(siguienteEtapa("propuesta")).toBeNull();
    expect(siguienteEtapa("ganada")).toBeNull();
    expect(siguienteEtapa("perdida")).toBeNull();
  });

  it("sabe cuáles están abiertas", () => {
    expect(abierta("demo")).toBe(true);
    expect(abierta("ganada")).toBe(false);
    expect(abierta("perdida")).toBe(false);
  });
});
