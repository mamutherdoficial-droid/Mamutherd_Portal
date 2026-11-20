"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useRecorridos } from "@/components/recorrido/Recorridos";
import { useAvisar } from "@/components/ui/Avisos";
import { Boton } from "@/components/ui/Boton";
import { reiniciarRecorridos } from "@/lib/acciones/recorridos";

export function RepetirRecorrido() {
  const avisar = useAvisar();
  const router = useRouter();
  const { reiniciar } = useRecorridos();
  const [pendiente, iniciar] = useTransition();
  return (
    <Boton
      ancho
      disabled={pendiente}
      icono={<RotateCcw size={20} strokeWidth={1.75} aria-hidden />}
      onClick={() =>
        iniciar(async () => {
          const r = await reiniciarRecorridos();
          if (!r.ok) return avisar(r.error, "error");
          router.push("/hoy");
          reiniciar();
        })
      }
    >
      {pendiente ? "Un momento…" : "Hacer el recorrido otra vez"}
    </Boton>
  );
}
