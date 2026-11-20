import type { MetadataRoute } from "next";
import { APP, marca } from "@/lib/marca";

// PWA básica: "Agregar a pantalla de inicio" con el mamut (perfil-oscuro del kit).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP.nombre,
    short_name: APP.nombre,
    description: `Administración de ${marca.nombre}`,
    lang: "es-CO",
    start_url: "/hoy",
    scope: "/",
    display: "standalone",
    background_color: "#0f1e2e",
    theme_color: "#0f1e2e",
    icons: [
      { src: "/marca/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/marca/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/marca/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
