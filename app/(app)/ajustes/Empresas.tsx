"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { cambiarEmpresa } from "@/lib/acciones/producto";

/** Selector de empresa (Fase 5): para quien pertenece a más de una. */
export function Empresas({ empresas, actual }: { empresas: { id: string; nombre: string; rol: string }[]; actual: string }) {
  const avisar = useAvisar();
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie" data-testid="empresas">
      {empresas.map((e) => (
        <li key={e.id} className="flex min-h-14 items-center justify-between gap-3 px-4">
          <span>
            <span className="font-semibold">{e.nombre}</span>
            <span className="text-chico text-tinta-suave"> · {e.rol === "gerente" ? "Gerente" : "Ayudante"}</span>
          </span>
          {e.id === actual ? (
            <span className="inline-flex items-center gap-1 text-chico font-semibold text-bien">
              <Check size={16} strokeWidth={1.75} aria-hidden /> Estás aquí
            </span>
          ) : (
            <Boton
              variante="secundario"
              disabled={pendiente}
              onClick={() =>
                iniciar(async () => {
                  const r = await cambiarEmpresa(e.id);
                  avisar(r.ok ? (r.mensaje ?? "Listo") : r.error, r.ok ? "bien" : "error");
                  if (r.ok) router.push("/hoy");
                })
              }
            >
              Usar esta
            </Boton>
          )}
        </li>
      ))}
    </ul>
  );
}
