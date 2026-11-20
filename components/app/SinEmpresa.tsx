import { LogOut, UserX } from "lucide-react";
import { Boton } from "@/components/ui/Boton";
import { Vacio } from "@/components/ui/Vacio";
import { salir } from "@/lib/acciones/sesion";

/** Entró bien, pero su usuario aún no está vinculado a ninguna empresa. */
export function SinEmpresa({ correo }: { correo?: string | null }) {
  return (
    <Vacio
      icono={UserX}
      titulo="Tu usuario aún no está en ningún equipo"
      texto={`Pídele a tu gerente que te agregue${correo ? ` con el correo ${correo}` : ""}. Si eres el gerente, vincula tu usuario como dice COMO-EMPEZAR.md, paso 6.5.`}
      accion={
        <form action={salir}>
          <Boton type="submit" variante="secundario" icono={<LogOut size={20} strokeWidth={1.75} aria-hidden />}>
            Cerrar sesión
          </Boton>
        </form>
      }
    />
  );
}
