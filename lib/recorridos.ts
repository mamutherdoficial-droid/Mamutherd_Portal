// Todos los pasos del tutorial guiado, en un solo lugar (docs/DESIGN.md → "Tutorial guiado", D-019).
// Máximo 5 pasos por recorrido y frases de máximo 15 palabras.
// Si cambias los pasos de un recorrido, súbele la versión: vuelve a salir a quien ya lo vio.
// Cada elemento resaltado lleva data-recorrido="<objetivo>".

import type { Rol } from "@/lib/sesion";

export type Paso = {
  titulo: string;
  texto: string;
  /** data-recorrido del elemento a resaltar. Sin objetivo = pantalla de bienvenida. */
  objetivo?: string;
  /** El paso avanza cuando la persona toca el elemento (Interactive Walkthrough). */
  esperarToque?: boolean;
};

export type Recorrido = {
  id: string;
  version: number;
  tipo: "onboarding" | "walkthrough" | "tour";
  roles: Rol[];
  pasos: Paso[];
  /** Recorrido que sigue al terminar (no al saltar). */
  siguiente?: string;
};

export const RECORRIDOS: Recorrido[] = [
  {
    id: "bienvenida",
    version: 1,
    tipo: "onboarding",
    roles: ["gerente"],
    siguiente: "primera-visita",
    pasos: [
      { titulo: "Bienvenido a Portal Mamut", texto: "Aquí ves y mueves todo tu negocio, en el celular o en el PC." },
      {
        titulo: "Qué ves aquí",
        texto: "Tus clientes, las ventas en curso y a quién llamar hoy. Luego, cobros y equipo.",
      },
      { titulo: "Empecemos por lo más útil", texto: "Vamos a anotar tu primera visita de verdad. Toma 20 segundos." },
    ],
  },
  {
    id: "bienvenida-ayudante",
    version: 2,
    tipo: "onboarding",
    roles: ["ayudante"],
    siguiente: "primera-visita",
    pasos: [
      { titulo: "Bienvenida a Portal Mamut", texto: "Aquí anotas tus visitas y ves cómo van tus ventas." },
      { titulo: "Qué ves aquí", texto: "Tu día, tus ventas, tus comisiones y tus tareas. Solo lo tuyo." },
      { titulo: "Cómo ganas", texto: "Tu comisión aparece cuando el negocio paga, no antes." },
      { titulo: "Empecemos", texto: "Vamos a anotar tu primera visita de verdad. Toma 20 segundos." },
    ],
  },
  {
    id: "primera-visita",
    version: 1,
    tipo: "walkthrough",
    roles: ["gerente", "ayudante"],
    pasos: [
      {
        titulo: "Anota la visita",
        texto: "Toca este botón cada vez que salgas de un negocio.",
        objetivo: "anotar-visita",
        esperarToque: true,
      },
    ],
  },
  {
    id: "ventas",
    version: 1,
    tipo: "tour",
    roles: ["gerente", "ayudante"],
    pasos: [
      { titulo: "Tus ventas por etapa", texto: "Cada venta avanza: contactado, demo, propuesta.", objetivo: "ventas-etapas" },
      { titulo: "Filtra", texto: "Mira solo un producto, una persona o las que no tienen fecha.", objetivo: "ventas-filtros" },
      { titulo: "Mueve la venta", texto: "Cuando avance, pásala a la siguiente etapa con un toque.", objetivo: "ventas-pasar" },
      { titulo: "Nunca sin seguimiento", texto: "Toda venta abierta necesita próxima fecha para salir en Hoy.", objetivo: "ventas-fecha" },
    ],
  },
  {
    id: "cobros",
    version: 1,
    tipo: "tour",
    roles: ["gerente"],
    pasos: [
      { titulo: "Lo que te deben", texto: "Por cobrar, vencidos y pagados. Empieza siempre por los vencidos.", objetivo: "cobros-pestanas" },
      { titulo: "Registra lo que entró", texto: "Registra lo que ya entró por Nequi o el banco.", objetivo: "cobros-pagar" },
      { titulo: "Recuérdale por WhatsApp", texto: "El mensaje sale escrito con el saldo; revísalo y envíalo.", objetivo: "cobros-whatsapp" },
      { titulo: "Mensualidades del mes", texto: "El día 1 tócalo: crea el cobro de cada plan mensual.", objetivo: "cobros-mensualidades" },
    ],
  },
  {
    id: "equipo",
    version: 2,
    tipo: "tour",
    roles: ["gerente"],
    pasos: [
      { titulo: "Tu equipo", texto: "Quién está, quién ya entra al portal y cuánto le debes.", objetivo: "equipo-lista" },
      { titulo: "Suma a alguien", texto: "Agrégala aquí y luego invítala con un enlace por WhatsApp.", objetivo: "equipo-agregar" },
    ],
  },
  {
    id: "tareas",
    version: 1,
    tipo: "tour",
    roles: ["gerente"],
    pasos: [
      { titulo: "Asigna tareas", texto: "Fotos, instalaciones, seguimientos. Con valor, queda por pagar al terminar.", objetivo: "tareas-nueva" },
      { titulo: "Márcala hecha", texto: "Un toque en el círculo y queda lista.", objetivo: "tareas-marcar" },
    ],
  },
  {
    id: "mis-tareas",
    version: 1,
    tipo: "tour",
    roles: ["ayudante"],
    pasos: [
      { titulo: "Tus tareas", texto: "Lo que te asignaron. Cuando la termines, toca el círculo.", objetivo: "tareas-marcar" },
    ],
  },
  {
    id: "mis-comisiones",
    version: 1,
    tipo: "tour",
    roles: ["ayudante"],
    pasos: [
      { titulo: "Tu plata", texto: "Lo que te debemos y lo que ya te pagamos.", objetivo: "comisiones-totales" },
      { titulo: "Cada comisión", texto: "Aparece cuando el negocio paga, no antes.", objetivo: "comisiones-lista" },
    ],
  },
  {
    id: "inventario",
    version: 1,
    tipo: "tour",
    roles: ["gerente"],
    pasos: [
      { titulo: "Tu stock", texto: "Cuántos tags, soportes y placas tienes. En rojo, toca comprar.", objetivo: "inventario-items" },
      { titulo: "Registra la compra", texto: "Cuando compres, anótalo aquí con lo que pagaste.", objetivo: "inventario-comprar" },
      { titulo: "Cada instalación", texto: "Al instalar en un negocio, el stock baja solo.", objetivo: "inventario-instalar" },
    ],
  },
  {
    id: "metas",
    version: 1,
    tipo: "tour",
    roles: ["gerente", "ayudante"],
    pasos: [
      { titulo: "Cómo vas", texto: "Las barras suben solas con cada visita anotada.", objetivo: "metas-avance" },
      { titulo: "Pon las metas", texto: "El domingo pon las de la semana siguiente.", objetivo: "metas-poner" },
    ],
  },
  {
    id: "semana",
    version: 1,
    tipo: "tour",
    roles: ["gerente"],
    pasos: [
      { titulo: "Tu revisión del domingo", texto: "Visitas, dueños y clientes contra la meta.", objetivo: "semana-cifras" },
      { titulo: "Ajusta el guion", texto: "Lo que más te dicen al perder una venta.", objetivo: "semana-objeciones" },
    ],
  },
];

/** Hotspots (punto ámbar sobre algo nuevo). Se guardan en recorridos_vistos con este id. */
export const HOTSPOTS = [{ id: "hotspot-mensualidades", version: 1 }] as const;

/** Pasos guiados dentro de "Anotar visita" (continúan el recorrido "primera-visita"). */
export const PASOS_FORMULARIO_VISITA = [
  { campo: "negocio", texto: "Escribe el negocio. Si es nuevo, tócalo en «Crear»." },
  { campo: "producto", texto: "¿Qué le ofreciste? Queda elegido el último que usaste." },
  { campo: "dueno", texto: "¿Hablaste con el dueño? Eso cuenta para tu meta." },
  { campo: "resultado", texto: "¿Cómo te fue? Esto mueve la venta solita." },
  { campo: "fecha", texto: "¿Cuándo vuelves? Ese día sale en Hoy. Luego toca Guardar." },
] as const;

export function recorrido(id: string): Recorrido | undefined {
  return RECORRIDOS.find((r) => r.id === id);
}

/** Recorrido de bienvenida según el rol. */
export function bienvenidaDe(rol: Rol): Recorrido {
  return recorrido(rol === "gerente" ? "bienvenida" : "bienvenida-ayudante")!;
}

/** ¿Hay que mostrarlo? Sí si nunca lo vio o lo vio en una versión anterior. */
export function pendiente(r: Recorrido, vistos: Record<string, number>): boolean {
  const visto = vistos[r.id];
  return visto === undefined || visto < r.version;
}
