import type { Rol } from "@/lib/sesion";

// Secciones de la app (ARQUITECTURA.md → Rutas). `fase` = cuándo llega; antes se muestra como "Pronto".
export type Seccion = {
  ruta: string;
  etiqueta: string;
  icono:
    | "hoy"
    | "ventas"
    | "clientes"
    | "cobros"
    | "comisiones"
    | "equipo"
    | "tareas"
    | "inventario"
    | "metas"
    | "ajustes"
    | "guia"
    | "mas";
  roles: Rol[];
  fase: number;
};

export const FASE_ACTUAL = 5;

export const SECCIONES: Seccion[] = [
  { ruta: "/hoy", etiqueta: "Hoy", icono: "hoy", roles: ["gerente", "ayudante"], fase: 0 },
  { ruta: "/ventas", etiqueta: "Ventas", icono: "ventas", roles: ["gerente", "ayudante"], fase: 1 },
  { ruta: "/clientes", etiqueta: "Clientes", icono: "clientes", roles: ["gerente", "ayudante"], fase: 1 },
  { ruta: "/cobros", etiqueta: "Cobros", icono: "cobros", roles: ["gerente"], fase: 2 },
  { ruta: "/mis-comisiones", etiqueta: "Comisiones", icono: "comisiones", roles: ["ayudante"], fase: 2 },
  { ruta: "/equipo", etiqueta: "Equipo", icono: "equipo", roles: ["gerente"], fase: 2 },
  { ruta: "/tareas", etiqueta: "Tareas", icono: "tareas", roles: ["gerente", "ayudante"], fase: 3 },
  { ruta: "/inventario", etiqueta: "Inventario", icono: "inventario", roles: ["gerente"], fase: 4 },
  { ruta: "/metas", etiqueta: "Metas", icono: "metas", roles: ["gerente", "ayudante"], fase: 4 },
  { ruta: "/ajustes", etiqueta: "Ajustes", icono: "ajustes", roles: ["gerente", "ayudante"], fase: 0 },
  { ruta: "/guia", etiqueta: "Guía", icono: "guia", roles: ["gerente", "ayudante"], fase: 1 },
];

export function seccionesDe(rol: Rol) {
  return SECCIONES.filter((s) => s.roles.includes(rol));
}

/** Barra inferior del celular: Hoy · Ventas · Cobros (gerente) o Comisiones (ayudante) · Más. */
export function barraInferior(rol: Rol): Seccion[] {
  const tercera = rol === "gerente" ? "/cobros" : "/mis-comisiones";
  const elegidas = ["/hoy", "/ventas", tercera]
    .map((r) => SECCIONES.find((s) => s.ruta === r))
    .filter((s): s is Seccion => Boolean(s));
  return [...elegidas, { ruta: "/mas", etiqueta: "Más", icono: "mas", roles: [rol], fase: 0 }];
}

export function disponible(s: Seccion) {
  return s.fase <= FASE_ACTUAL;
}
