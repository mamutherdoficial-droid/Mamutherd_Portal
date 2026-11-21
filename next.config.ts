import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // read-excel-file (extractos, Fase 4b) menciona un paquete opcional de S3 que no usamos:
  // se carga tal cual desde node_modules en el servidor, sin empaquetarlo.
  serverExternalPackages: ["read-excel-file"],
};

export default nextConfig;
