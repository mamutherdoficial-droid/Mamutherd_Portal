import { describe, expect, it } from "vitest";
import { diaBogota, fechaLarga, finSemana, inicioSemana, semanaDe, sumarDias, textoFecha } from "./semanas";

describe("semanas de lunes a domingo", () => {
  it("el lunes de un viernes", () => {
    expect(inicioSemana("2026-11-20")).toBe("2026-11-16");
    expect(finSemana("2026-11-20")).toBe("2026-11-22");
  });

  it("un lunes es su propio inicio y un domingo su propio fin", () => {
    expect(inicioSemana("2026-11-23")).toBe("2026-11-23");
    expect(finSemana("2026-11-22")).toBe("2026-11-22");
    expect(inicioSemana("2026-11-22")).toBe("2026-11-16");
  });

  it("cruza meses y años", () => {
    expect(inicioSemana("2027-01-01")).toBe("2026-12-28");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("hora de Bogotá", () => {
  it("a las 11 p. m. de Bogotá ya es el día siguiente en UTC, pero sigue siendo hoy", () => {
    // 2026-11-23 04:00 UTC = 2026-11-22 23:00 en Bogotá (domingo)
    const instante = new Date("2026-11-23T04:00:00Z");
    expect(diaBogota(instante)).toBe("2026-11-22");
    expect(semanaDe(instante)).toEqual({ lunes: "2026-11-16", domingo: "2026-11-22" });
  });

  it("texto de seguimiento según la fecha", () => {
    expect(textoFecha("2026-11-20", "2026-11-20")).toEqual({ texto: "Hoy", estado: "alerta" });
    expect(textoFecha("2026-11-21", "2026-11-20").texto).toBe("Mañana");
    expect(textoFecha("2026-11-19", "2026-11-20")).toEqual({ texto: "Vencida ayer", estado: "error" });
    expect(textoFecha("2026-11-17", "2026-11-20").texto).toBe("Vencida hace 3 días");
    expect(textoFecha("2026-11-24", "2026-11-20").texto).toBe("Martes 24 de noviembre");
  });

  it("fecha larga en español", () => {
    expect(fechaLarga("2026-11-24")).toBe("Martes 24 de noviembre");
  });
});
