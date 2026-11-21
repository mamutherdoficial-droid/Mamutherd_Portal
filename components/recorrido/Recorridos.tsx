"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { marcarRecorrido } from "@/lib/acciones/recorridos";
import { bienvenidaDe, pendiente, recorrido as buscar, type Recorrido } from "@/lib/recorridos";
import type { Rol } from "@/lib/sesion";
import { Bienvenida } from "./Bienvenida";
import { CoachMarks } from "./CoachMarks";

type Estado = {
  /** El formulario de "Anotar visita" muestra sus pasos guiados. */
  guiandoVisita: boolean;
  /** Termina el recorrido de la primera visita (al guardar la visita). */
  terminarVisitaGuiada: () => void;
  /** Lanza un recorrido si está pendiente (lo usan las páginas al abrir). */
  ofrecer: (id: string) => void;
  /** Vuelve a empezar el tutorial desde la bienvenida. */
  reiniciar: () => void;
  /** Hotspots: ¿falta verlo? (se esconde mientras corre otro recorrido). */
  hotspotPendiente: (id: string, version: number) => boolean;
  /** Hotspots: marcarlo visto (se guarda en recorridos_vistos como cualquier recorrido). */
  verHotspot: (id: string, version: number) => void;
};

const Contexto = createContext<Estado>({
  guiandoVisita: false,
  terminarVisitaGuiada: () => {},
  ofrecer: () => {},
  reiniciar: () => {},
  hotspotPendiente: () => false,
  verHotspot: () => {},
});

export function useRecorridos() {
  return useContext(Contexto);
}

/**
 * Orquesta el tutorial guiado: bienvenida al primer ingreso, walkthrough de la primera visita
 * y product tours de cada sección. Uno a la vez. Lo visto se guarda en recorridos_vistos.
 */
export function ProveedorRecorridos({
  rol,
  vistosIniciales,
  children,
}: {
  rol: Rol;
  vistosIniciales: Record<string, number>;
  children: ReactNode;
}) {
  const [vistos, setVistos] = useState(vistosIniciales);
  // Primer ingreso: arranca con la bienvenida.
  const [activo, setActivo] = useState<Recorrido | null>(() => {
    const b = bienvenidaDe(rol);
    return pendiente(b, vistosIniciales) ? b : null;
  });
  const [guiandoVisita, setGuiandoVisita] = useState(false);

  const registrar = useCallback((r: Recorrido, saltado: boolean) => {
    setVistos((v) => ({ ...v, [r.id]: r.version }));
    void marcarRecorrido(r.id, r.version, saltado);
  }, []);

  /** "Hacer el recorrido otra vez": olvida lo visto en este navegador y vuelve a la bienvenida. */
  const reiniciar = useCallback(() => {
    setVistos({});
    setGuiandoVisita(false);
    setActivo(bienvenidaDe(rol));
  }, [rol]);

  const ofrecer = useCallback(
    (id: string) => {
      const r = buscar(id);
      if (!r || !r.roles.includes(rol)) return;
      setActivo((actual) => (actual || guiandoVisita || !pendiente(r, vistos) ? actual : r));
    },
    [rol, vistos, guiandoVisita],
  );

  const terminar = useCallback(
    (saltado: boolean) => {
      if (!activo) return;
      registrar(activo, saltado);
      const sig = !saltado && activo.siguiente ? buscar(activo.siguiente) : undefined;
      if (saltado && activo.siguiente) {
        // Saltar la bienvenida también salta la primera visita guiada.
        const s = buscar(activo.siguiente);
        if (s) registrar(s, true);
      }
      setActivo(sig && pendiente(sig, vistos) ? sig : null);
    },
    [activo, registrar, vistos],
  );

  // El walkthrough de la primera visita pasa al formulario cuando tocan "Anotar visita".
  const alTocarObjetivo = useCallback(() => {
    if (activo?.id === "primera-visita") {
      setActivo(null);
      setGuiandoVisita(true);
    }
  }, [activo]);

  const terminarVisitaGuiada = useCallback(() => {
    if (!guiandoVisita) return;
    setGuiandoVisita(false);
    const r = buscar("primera-visita");
    if (r) registrar(r, false);
  }, [guiandoVisita, registrar]);

  const hotspotPendiente = useCallback(
    (id: string, version: number) => !activo && !guiandoVisita && (vistos[id] ?? 0) < version,
    [activo, guiandoVisita, vistos],
  );
  const verHotspot = useCallback((id: string, version: number) => {
    setVistos((v) => ({ ...v, [id]: version }));
    void marcarRecorrido(id, version, false);
  }, []);

  const valor = useMemo(
    () => ({ guiandoVisita, terminarVisitaGuiada, ofrecer, reiniciar, hotspotPendiente, verHotspot }),
    [guiandoVisita, terminarVisitaGuiada, ofrecer, reiniciar, hotspotPendiente, verHotspot],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      {activo?.tipo === "onboarding" && (
        <Bienvenida recorrido={activo} alTerminar={() => terminar(false)} alSaltar={() => terminar(true)} />
      )}
      {activo && activo.tipo !== "onboarding" && (
        <CoachMarks
          recorrido={activo}
          alTerminar={() => terminar(false)}
          alSaltar={() => terminar(true)}
          alTocarObjetivo={alTocarObjetivo}
        />
      )}
    </Contexto.Provider>
  );
}

/** Pone en una página: ofrece su product tour la primera vez que se abre. */
export function OfrecerRecorrido({ id }: { id: string }) {
  const { ofrecer } = useRecorridos();
  useEffect(() => {
    const t = window.setTimeout(() => ofrecer(id), 400); // deja pintar la página
    return () => window.clearTimeout(t);
  }, [id, ofrecer]);
  return null;
}
