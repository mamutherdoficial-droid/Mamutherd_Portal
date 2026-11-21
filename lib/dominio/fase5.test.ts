import { describe, expect, it } from "vitest";
import { leerCsv } from "./extractos/leer";
import { aCsv, claveNegocio, leerClientes } from "./importar";
import { PLANTILLAS } from "./plantillas";

describe("plantillas", () => {
  it("precios en pesos enteros y comisiones válidas", () => {
    for (const p of PLANTILLAS) {
      for (const pr of p.productos) for (const pl of pr.planes) if (pl.precio != null) expect(Number.isSafeInteger(pl.precio)).toBe(true);
      for (const r of p.reglas) {
        expect(r.porcentaje).toBeGreaterThan(0);
        expect(r.porcentaje).toBeLessThanOrEqual(100);
      }
    }
    expect(new Set(PLANTILLAS.map((p) => p.id)).size).toBe(PLANTILLAS.length);
  });
});

describe("importar clientes", () => {
  it("lee títulos en español, normaliza WhatsApp e Instagram y cuenta filas sin nombre", () => {
    const csv = "Negocio;Barrio;Dueño;Celular;Instagram\nCafé Luna;Chapinero;Luisa;320 487 1882;@cafeluna\n;Suba;Sin nombre;;\nPanadería El Trigal;Suba;;;\n";
    const { clientes, sinNombre } = leerClientes(leerCsv(csv));
    expect(clientes).toHaveLength(2);
    expect(clientes[0]).toMatchObject({ nombre_negocio: "Café Luna", barrio: "Chapinero", contacto_nombre: "Luisa", contacto_whatsapp: "573204871882", instagram: "cafeluna" });
    expect(sinNombre).toBe(1);
  });
  it("sin columna de negocio explica qué falta", () => {
    expect(() => leerClientes([["Barrio"], ["Suba"]])).toThrow(/nombre del negocio/);
  });
  it("la clave no distingue tildes ni mayúsculas", () => {
    expect(claveNegocio("Café LUNA")).toBe(claveNegocio("cafe luna"));
  });
  it("exporta CSV con punto y coma y comillas cuando hace falta", () => {
    const t = aCsv([["Negocio", "Notas"], ["Café; Luna", 'dijo "sí"']]);
    expect(t).toContain('"Café; Luna";"dijo ""sí"""');
    expect(t.startsWith("\uFEFF")).toBe(true);
  });
});
