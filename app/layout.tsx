import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { APP, marca } from "@/lib/marca";
import "./globals.css";

// Fuentes de Mamut Herd, locales (licencia OFL en app/fuentes/).
const unbounded = localFont({
  src: "./fuentes/unbounded-800.woff",
  weight: "800",
  variable: "--font-unbounded",
  display: "swap",
});

const manrope = localFont({
  src: "./fuentes/manrope-var.woff",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: APP.nombre, template: `%s · ${APP.nombre}` },
  description: `Clientes, ventas, cobros y equipo de ${marca.nombre}, en el celular y en el PC.`,
  applicationName: APP.nombre,
  appleWebApp: { capable: true, title: APP.nombre, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1e2e" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
