// Datos de Mamut Herd en un solo lugar, leídos del kit de marca (docs/mamut-herd/mamut-herd.json).
// Si cambia algo de la empresa, se cambia en el JSON del kit y aquí se actualiza solo.
import datos from "@/docs/mamut-herd/mamut-herd.json";

/** Pendiente: la web de Mamut Herd todavía no está publicada (SEGUIMIENTO.md). */
export const MAMUT_HERD_URL = datos.contacto.web;
export const WEB_PUBLICADA = MAMUT_HERD_URL.startsWith("http");

export const marca = {
  nombre: datos.nombre,
  eslogan: datos.eslogan.es,
  firma: datos.firma.es,
  descripcion: datos.descripcion_corta.es,
  derechos: datos.derechos,
  correo: datos.contacto.correo,
  whatsapp: datos.contacto.whatsapp,
  whatsappUrl: datos.contacto.whatsapp_url,
} as const;

export const APP = {
  nombre: "Portal Mamut",
  version: "0.1.0",
  acercaDe: `Portal Mamut es un producto de ${datos.nombre}, una empresa que crea productos digitales y ayuda a empresas pequeñas a crecer.`,
} as const;
