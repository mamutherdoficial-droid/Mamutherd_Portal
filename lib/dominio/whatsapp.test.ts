import { describe, expect, it } from "vitest";
import { enlaceWhatsapp, mensajeSeguimiento, mostrarWhatsapp, normalizarWhatsapp } from "./whatsapp";

describe("normalizarWhatsapp", () => {
  it("acepta celulares colombianos escritos de muchas formas", () => {
    expect(normalizarWhatsapp("320 487 1882")).toBe("573204871882");
    expect(normalizarWhatsapp("+57 320-487-1882")).toBe("573204871882");
    expect(normalizarWhatsapp("573204871882")).toBe("573204871882");
    expect(normalizarWhatsapp("0057 3204871882")).toBe("573204871882");
  });

  it("rechaza lo que no es un celular", () => {
    expect(normalizarWhatsapp("6014567890")).toBeNull();
    expect(normalizarWhatsapp("123")).toBeNull();
    expect(normalizarWhatsapp("")).toBeNull();
    expect(normalizarWhatsapp(null)).toBeNull();
  });
});

describe("enlaceWhatsapp", () => {
  it("arma el enlace wa.me con el mensaje", () => {
    expect(enlaceWhatsapp("3204871882", "Hola, ¿qué tal?")).toBe(
      "https://wa.me/573204871882?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F",
    );
  });

  it("sin número deja elegir el chat", () => {
    expect(enlaceWhatsapp(null, "Hola")).toBe("https://wa.me/?text=Hola");
  });
});

describe("mensajes", () => {
  it("muestra el número bonito", () => {
    expect(mostrarWhatsapp("573204871882")).toBe("320 487 1882");
  });

  it("el seguimiento saluda por el primer nombre", () => {
    const m = mensajeSeguimiento({ contacto: "Luisa Gómez", negocio: "Café Luna", producto: "Nef", quien: "Jacobo" });
    expect(m).toContain("Hola Luisa");
    expect(m).toContain("Nef para Café Luna");
  });
});
