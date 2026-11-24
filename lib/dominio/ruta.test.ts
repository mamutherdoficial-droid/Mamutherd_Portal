import { describe, expect, it } from 'vitest';
import {
  distanciaM, enlaceIrA, estimarCaminata, largoRecorridoM, leerEnlaceMaps,
  ordenarPorCercania, resumenRuta, tramosGoogleMaps, type Parada,
} from './ruta';

// Carrera 13 de Chapinero, de la calle 39 a la 63 (aprox.), desordenadas a propósito.
const cra13: Parada[] = [
  { id: 'c57', lat: 4.6440, lng: -74.0636 },
  { id: 'c39', lat: 4.6280, lng: -74.0675 },
  { id: 'c63', lat: 4.6487, lng: -74.0627 },
  { id: 'c45', lat: 4.6336, lng: -74.0660 },
  { id: 'c51', lat: 4.6390, lng: -74.0648 },
];

describe('distanciaM', () => {
  it('de la calle 39 a la 63 por la 13 son unos 2,3 km en línea recta', () => {
    const d = distanciaM(cra13[1]!, cra13[2]!);
    expect(d).toBeGreaterThan(2200);
    expect(d).toBeLessThan(2450);
  });
  it('un punto consigo mismo es 0', () => {
    expect(distanciaM(cra13[0]!, cra13[0]!)).toBe(0);
  });
});

describe('ordenarPorCercania', () => {
  it('desde la 39, recorre la 13 hacia el norte en orden', () => {
    const inicio = { lat: 4.6275, lng: -74.0678 };
    expect(ordenarPorCercania(cra13, inicio).map((p) => p.id)).toEqual(['c39', 'c45', 'c51', 'c57', 'c63']);
  });
  it('nunca alarga el recorrido frente al orden original', () => {
    const inicio = { lat: 4.6490, lng: -74.0620 };
    const orden = ordenarPorCercania(cra13, inicio);
    expect(largoRecorridoM(orden, inicio)).toBeLessThanOrEqual(largoRecorridoM(cra13, inicio));
    expect(new Set(orden.map((p) => p.id)).size).toBe(cra13.length);
  });
  it('sin paradas devuelve una lista vacía', () => {
    expect(ordenarPorCercania([], { lat: 4.6, lng: -74 })).toEqual([]);
  });
});

describe('enlaces de Google Maps', () => {
  it('"Ir" abre indicaciones a pie hasta la parada', () => {
    const url = new URL(enlaceIrA(cra13[0]!));
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('destination')).toBe('4.644000,-74.063600');
    expect(url.searchParams.get('travelmode')).toBe('walking');
  });
  it('parte 9 paradas en tramos de hasta 3 intermedios + destino, encadenados', () => {
    const nueve = Array.from({ length: 9 }, (_, i) => ({ lat: 4.63 + i / 1000, lng: -74.06 }));
    const tramos = tramosGoogleMaps(nueve).map((u) => new URL(u).searchParams);
    expect(tramos).toHaveLength(3);
    expect(tramos[0]!.get('origin')).toBeNull(); // sale de donde estés
    expect(tramos[0]!.get('waypoints')?.split('|')).toHaveLength(3);
    expect(tramos[1]!.get('origin')).toBe(tramos[0]!.get('destination'));
    expect(tramos[2]!.get('waypoints')).toBeNull(); // la última parada sola
  });
});

describe('leerEnlaceMaps', () => {
  it('lee el pin exacto antes que el centro del mapa', () => {
    const url = 'https://www.google.com/maps/place/Caf%C3%A9/@4.6330,-74.0650,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d4.6336!4d-74.0660';
    expect(leerEnlaceMaps(url)).toEqual({ lat: 4.6336, lng: -74.066 });
  });
  it('lee ?q= y coordenadas pegadas sueltas', () => {
    expect(leerEnlaceMaps('https://maps.google.com/?q=4.6487,-74.0627')).toEqual({ lat: 4.6487, lng: -74.0627 });
    expect(leerEnlaceMaps('4.6280, -74.0675')).toEqual({ lat: 4.628, lng: -74.0675 });
  });
  it('devuelve null si no hay coordenadas', () => {
    expect(leerEnlaceMaps('https://maps.app.goo.gl/AbCdEf')).toBeNull();
    expect(leerEnlaceMaps('Cra 13 # 45-20')).toBeNull();
  });
});

describe('resumen y estimado', () => {
  it('escribe km con coma decimal y minutos', () => {
    expect(resumenRuta(2400, 1860)).toBe('2,4 km · 31 min a pie');
    expect(resumenRuta(640, 500)).toBe('640 m · 8 min a pie');
  });
  it('estima la caminata con calles en cuadrícula', () => {
    const { metros, segundos } = estimarCaminata(cra13.slice(1, 3));
    expect(metros).toBeGreaterThan(2800);
    expect(Math.round(segundos / 60)).toBeGreaterThan(35);
  });
});
