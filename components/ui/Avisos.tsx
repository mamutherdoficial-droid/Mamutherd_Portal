"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { cx } from "./clases";

type Aviso = { id: number; texto: string; tipo: "bien" | "error" };
const Contexto = createContext<(texto: string, tipo?: Aviso["tipo"]) => void>(() => {});

/** avisar("Visita anotada") muestra un aviso corto abajo de la pantalla. */
export function useAvisar() {
  return useContext(Contexto);
}

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((texto: string, tipo: Aviso["tipo"] = "bien") => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a.slice(-2), { id, texto, tipo }]);
    window.setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === "error" ? 6000 : 3000);
  }, []);

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 lg:bottom-6"
      >
        {avisos.map((a) => (
          <p
            key={a.id}
            role={a.tipo === "error" ? "alert" : "status"}
            className={cx(
              "flex items-center gap-2 rounded-control px-4 py-3 font-semibold shadow-lg motion-safe:animate-[aparecer_150ms_ease-out]",
              a.tipo === "error" ? "bg-error text-white" : "bg-principal text-sobre-principal",
            )}
          >
            {a.tipo === "error" ? (
              <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
            ) : (
              <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden />
            )}
            {a.texto}
          </p>
        ))}
      </div>
    </Contexto.Provider>
  );
}
