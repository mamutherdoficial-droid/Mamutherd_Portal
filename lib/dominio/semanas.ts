// Fechas de negocio en hora de Bogotá; semanas de lunes a domingo (CLAUDE.md, regla 5).
// Las fechas de negocio se manejan como texto "AAAA-MM-DD" para que no las mueva la zona horaria.

export const ZONA = "America/Bogota";

const partes = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Día de Bogotá en que cae un instante: "2026-11-20". */
export function diaBogota(instante: Date = new Date()): string {
  return partes.format(instante);
}

function aUTC(dia: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) throw new Error(`Fecha inválida: ${dia}`);
  return new Date(`${dia}T00:00:00Z`);
}

function aTexto(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Suma (o resta) días a una fecha "AAAA-MM-DD". */
export function sumarDias(dia: string, dias: number): string {
  const f = aUTC(dia);
  f.setUTCDate(f.getUTCDate() + dias);
  return aTexto(f);
}

/** Lunes de la semana de ese día. */
export function inicioSemana(dia: string): string {
  const f = aUTC(dia);
  const desdeLunes = (f.getUTCDay() + 6) % 7; // lunes = 0 … domingo = 6
  return sumarDias(dia, -desdeLunes);
}

/** Domingo de la semana de ese día. */
export function finSemana(dia: string): string {
  return sumarDias(inicioSemana(dia), 6);
}

/** Semana actual en Bogotá: { lunes, domingo }. */
export function semanaDe(instante: Date = new Date()) {
  const hoy = diaBogota(instante);
  return { lunes: inicioSemana(hoy), domingo: finSemana(hoy) };
}

const largo = new Intl.DateTimeFormat("es-CO", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "Viernes 20 de noviembre" */
export function fechaLarga(dia: string): string {
  const texto = largo.format(aUTC(dia)).replace(",", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
