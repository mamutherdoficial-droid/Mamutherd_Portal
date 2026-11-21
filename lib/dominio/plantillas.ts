// Plantillas de inicio por tipo de negocio (Fase 5). Son un punto de partida editable:
// productos, planes y reglas de comisión de ejemplo. Dinero en pesos enteros (regla 2).

export type Plantilla = {
  id: string;
  nombre: string;
  descripcion: string;
  productos: {
    nombre: string;
    planes: { nombre: string; tipo: "unico" | "mensual"; precio: number | null }[];
  }[];
  reglas: { atribucion: "propia" | "conjunta" | "referido"; concepto: "instalacion" | "mensualidad"; porcentaje: number; meses_max?: number }[];
};

const REGLAS_BASICAS: Plantilla["reglas"] = [
  { atribucion: "propia", concepto: "instalacion", porcentaje: 25 },
  { atribucion: "propia", concepto: "mensualidad", porcentaje: 10, meses_max: 6 },
  { atribucion: "conjunta", concepto: "instalacion", porcentaje: 15 },
  { atribucion: "referido", concepto: "instalacion", porcentaje: 10 },
];

export const PLANTILLAS: Plantilla[] = [
  {
    id: "servicios-mensuales",
    nombre: "Servicio con mensualidad",
    descripcion: "Instalas o configuras algo y cobras una mensualidad (software, mantenimiento, suscripciones).",
    productos: [
      {
        nombre: "Servicio principal",
        planes: [
          { nombre: "Instalación", tipo: "unico", precio: 200000 },
          { nombre: "Plan mensual", tipo: "mensual", precio: 50000 },
        ],
      },
    ],
    reglas: REGLAS_BASICAS,
  },
  {
    id: "venta-unica",
    nombre: "Venta por proyecto",
    descripcion: "Cada venta es un trabajo o un producto que se paga una vez (diseño, fotos, eventos).",
    productos: [{ nombre: "Proyecto", planes: [{ nombre: "Proyecto estándar", tipo: "unico", precio: null }] }],
    reglas: REGLAS_BASICAS.filter((r) => r.concepto === "instalacion"),
  },
  {
    id: "vacia",
    nombre: "Empezar en blanco",
    descripcion: "Sin productos ni reglas: los creas tú.",
    productos: [],
    reglas: [],
  },
];

export function plantilla(id: string): Plantilla | undefined {
  return PLANTILLAS.find((p) => p.id === id);
}
