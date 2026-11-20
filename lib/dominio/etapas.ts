// Etapas de una oportunidad (docs/MODELO-DATOS.md → Oportunidades).
export const ETAPAS = ["prospecto", "contactado", "demo", "propuesta", "ganada", "perdida"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const ETAPAS_ABIERTAS = ["prospecto", "contactado", "demo", "propuesta"] as const satisfies readonly Etapa[];

export const NOMBRE_ETAPA: Record<Etapa, string> = {
  prospecto: "Prospecto",
  contactado: "Contactado",
  demo: "Demo",
  propuesta: "Propuesta",
  ganada: "Ganada",
  perdida: "Perdida",
};

export function esEtapa(x: string): x is Etapa {
  return (ETAPAS as readonly string[]).includes(x);
}

export function abierta(etapa: string): boolean {
  return (ETAPAS_ABIERTAS as readonly string[]).includes(etapa);
}

/**
 * Siguiente etapa con el botón "Pasar a …". Ganada no sale aquí: la marca el gerente
 * cuando entra el primer pago (D-010, Fase 2). Perdida tiene su propio botón (pide motivo).
 */
export function siguienteEtapa(etapa: string): Etapa | null {
  const i = (ETAPAS_ABIERTAS as readonly string[]).indexOf(etapa);
  if (i < 0 || i >= ETAPAS_ABIERTAS.length - 1) return null;
  return ETAPAS_ABIERTAS[i + 1] ?? null;
}

// Resultado de una visita (chips de "Anotar visita").
export const RESULTADOS = [
  { valor: "interesado", etiqueta: "Interesado", accion: "Volver con la demo" },
  { valor: "pidio_propuesta", etiqueta: "Pidió propuesta", accion: "Mandar la propuesta" },
  { valor: "volver", etiqueta: "Volver otro día", accion: "Volver a pasar" },
  { valor: "no_interesa", etiqueta: "No le interesa", accion: "" },
] as const;
export type Resultado = (typeof RESULTADOS)[number]["valor"];
