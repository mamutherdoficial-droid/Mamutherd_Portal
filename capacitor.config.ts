import type { CapacitorConfig } from "@capacitor/cli";

// App Android del Portal Mamut (D-029): abre la web publicada en Vercel dentro de la app.
// Cada cambio que se publica en Vercel aparece en la app sin reinstalar.
const config: CapacitorConfig = {
  appId: "com.mamutherd.portal",
  appName: "Portal Mamut",
  // Solo la pantalla de "Sin conexión"; la app real viene de server.url.
  webDir: "capacitor-www",
  server: {
    url: "https://portalmamutherd.vercel.app/hoy",
    errorPath: "sin-conexion.html",
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0f1e2e",
  },
};

export default config;
