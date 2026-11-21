// Importar clientes desde un CSV (Fase 5). Puro y testeable: filas → clientes listos para insertar.
import { normalizar } from "./extractos/leer";
import { normalizarWhatsapp } from "./whatsapp";

export type ClienteImportado = {
  nombre_negocio: string;
  tipo_negocio: string | null;
  direccion: string | null;
  barrio: string | null;
  contacto_nombre: string | null;
  contacto_whatsapp: string | null;
  instagram: string | null;
  notas: string | null;
};

const COLUMNAS: Record<keyof ClienteImportado, RegExp> = {
  nombre_negocio: /^(negocio|nombre del negocio|nombre negocio|nombre|cliente|empresa)$/,
  tipo_negocio: /^(tipo|tipo de negocio|categoria)$/,
  direccion: /^(direccion)$/,
  barrio: /^(barrio|zona|sector)$/,
  contacto_nombre: /^(contacto|dueno|duena|propietario|encargado|nombre del contacto)$/,
  contacto_whatsapp: /^(whatsapp|celular|telefono|movil|cel)$/,
  instagram: /^(instagram|ig)$/,
  notas: /^(notas|nota|observaciones|comentarios)$/,
};

export const MAX_FILAS = 2000;

/** Lee las filas (la primera es de títulos). Devuelve los clientes válidos y cuántas filas no sirvieron. */
export function leerClientes(filas: string[][]): { clientes: ClienteImportado[]; sinNombre: number } {
  const titulos = (filas[0] ?? []).map((t) => normalizar(t));
  const idx = Object.fromEntries(
    Object.entries(COLUMNAS).map(([campo, re]) => [campo, titulos.findIndex((t) => re.test(t))]),
  ) as Record<keyof ClienteImportado, number>;
  if (idx.nombre_negocio < 0) throw new Error("Falta la columna del nombre del negocio (por ejemplo «Negocio»).");

  const texto = (fila: string[], campo: keyof ClienteImportado, max = 200) => {
    const i = idx[campo];
    const v = i >= 0 ? (fila[i] ?? "").trim() : "";
    return v ? v.slice(0, max) : null;
  };
  const clientes: ClienteImportado[] = [];
  let sinNombre = 0;
  for (const fila of filas.slice(1, MAX_FILAS + 1)) {
    if (fila.every((c) => !c?.trim())) continue;
    const nombre = texto(fila, "nombre_negocio", 120);
    if (!nombre || nombre.length < 2) {
      sinNombre++;
      continue;
    }
    clientes.push({
      nombre_negocio: nombre,
      tipo_negocio: texto(fila, "tipo_negocio", 80),
      direccion: texto(fila, "direccion"),
      barrio: texto(fila, "barrio", 80),
      contacto_nombre: texto(fila, "contacto_nombre", 120),
      contacto_whatsapp: normalizarWhatsapp(texto(fila, "contacto_whatsapp", 30)),
      instagram: texto(fila, "instagram", 60)?.replace(/^@/, "") ?? null,
      notas: texto(fila, "notas", 1000),
    });
  }
  return { clientes, sinNombre };
}

/** Clave para no duplicar: el nombre sin tildes ni mayúsculas. */
export function claveNegocio(nombre: string): string {
  return normalizar(nombre);
}

/** Convierte filas a CSV (punto y coma: Excel en español lo abre bien). */
export function aCsv(filas: (string | number | null)[][]): string {
  const celda = (v: string | number | null) => {
    const t = v == null ? "" : String(v);
    return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return "\uFEFF" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
}
