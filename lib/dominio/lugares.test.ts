import { describe, expect, it } from "vitest";
import { leerLugares } from "./lugares";

describe("pegar lugares", () => {
  it("lee nombre solo, enlace largo, coordenadas, enlace corto y dirección", () => {
    const { lugares, ignoradas } = leerLugares(
      [
        "1. Café Luna",
        "- Panadería El Trigal | https://www.google.com/maps/place/x/@4.6280,-74.0675,17z",
        "• Heladería Polar | 4.6336, -74.0660",
        "Brunch Club 63\thttps://maps.app.goo.gl/AbC123",
        "Pastelería Mora; Calle 48 # 13-15",
        "",
        "x",
      ].join("\n"),
    );
    expect(lugares.map((l) => l.nombre)).toEqual(["Café Luna", "Panadería El Trigal", "Heladería Polar", "Brunch Club 63", "Pastelería Mora"]);
    expect(lugares[0]).toMatchObject({ punto: null, enlaceCorto: null, direccion: null });
    expect(lugares[1]!.punto).toEqual({ lat: 4.628, lng: -74.0675 });
    expect(lugares[2]!.punto).toEqual({ lat: 4.6336, lng: -74.066 });
    expect(lugares[3]!.enlaceCorto).toBe("https://maps.app.goo.gl/AbC123");
    expect(lugares[4]!.direccion).toBe("Calle 48 # 13-15");
    expect(ignoradas).toBe(1);
  });

  it("máximo 30 lugares por vez", () => {
    const texto = Array.from({ length: 40 }, (_, i) => `Negocio ${i + 1}`).join("\n");
    expect(leerLugares(texto).lugares).toHaveLength(30);
  });
});
