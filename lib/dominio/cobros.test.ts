import { describe, expect, it } from "vitest";
import { anticipoSugerido, inicioMes, mesSiguiente, nombreMes, pestanaDe } from "./cobros";
import { mensajeCobro } from "./whatsapp";

describe("cobros", () => {
  it("anticipo sugerido: la mitad en pesos enteros, redondeada a mil", () => {
    expect(anticipoSugerido(200_000)).toBe(100_000);
    expect(anticipoSugerido(125_000)).toBe(62_000);
    expect(anticipoSugerido(0)).toBe(0);
    expect(Number.isInteger(anticipoSugerido(99_999))).toBe(true);
  });

  it("meses", () => {
    expect(nombreMes("2026-12-01")).toBe("diciembre");
    expect(nombreMes("2027-01-15")).toBe("enero");
    expect(inicioMes("2026-11-20")).toBe("2026-11-01");
    expect(mesSiguiente("2026-11-20")).toBe("2026-12-01");
    expect(mesSiguiente("2026-12-20")).toBe("2027-01-01");
  });

  it("pestaña de cada estado", () => {
    expect(pestanaDe("pendiente")).toBe("por-cobrar");
    expect(pestanaDe("parcial")).toBe("por-cobrar");
    expect(pestanaDe("vencido")).toBe("vencidos");
    expect(pestanaDe("pagado")).toBe("pagados");
    expect(pestanaDe("anulado")).toBeNull();
  });

  it("mensaje de cobro por WhatsApp", () => {
    const m = mensajeCobro({ contacto: "Luisa Gómez", negocio: "Café Luna", concepto: "Instalación", saldo: "$ 100.000", vence: "viernes 27 de noviembre", quien: "Jacobo" });
    expect(m).toContain("Hola Luisa");
    expect(m).toContain("instalación de Café Luna: $ 100.000");
  });
});
