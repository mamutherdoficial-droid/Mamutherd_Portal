"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Pantallas "de inicio": desde aquí, atrás minimiza la app en vez de navegar.
const RAICES = new Set(["/hoy", "/entrar"]);

/**
 * Botón / gesto "atrás" de Android dentro de la app (D-029). En el navegador no hace nada.
 * 1. Si hay una hoja abierta (<dialog>), la cierra.
 * 2. Si hay pantalla anterior dentro del portal, vuelve a ella.
 * 3. En la primera pantalla, minimiza la app (no la cierra).
 */
export function BotonAtras() {
  const router = useRouter();

  useEffect(() => {
    let quitar: (() => void) | undefined;
    let vivo = true;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");

      const escucha = await App.addListener("backButton", ({ canGoBack }) => {
        const abierta = document.querySelector<HTMLDialogElement>("dialog[open]");
        if (abierta) {
          abierta.close();
          return;
        }
        if (canGoBack && !RAICES.has(window.location.pathname)) {
          router.back();
          return;
        }
        void App.minimizeApp();
      });

      if (vivo) quitar = () => void escucha.remove();
      else void escucha.remove();
    })();

    return () => {
      vivo = false;
      quitar?.();
    };
  }, [router]);

  return null;
}
