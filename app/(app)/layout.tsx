import { LogOut } from "lucide-react";
import { BarraInferior, MenuLateral } from "@/components/app/Navegacion";
import { Logo } from "@/components/marca/Logo";
import { salir } from "@/lib/acciones/sesion";
import { barraInferior, seccionesDe } from "@/lib/navegacion";
import { obtenerContexto } from "@/lib/sesion";

const NOMBRE_ROL = { gerente: "Gerente", ayudante: "Ayudante" } as const;

/**
 * Una sola app para celular y PC (D-015): barra inferior en el celular,
 * menú lateral desde 1024 px. Mismo código y mismos datos.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const ctx = await obtenerContexto();
  const rol = ctx?.rol ?? "ayudante";

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        data-testid="menu-lateral"
        className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-borde bg-superficie p-4 lg:flex"
      >
        <div className="flex items-center gap-2.5 px-2 pt-2">
          <Logo logo="simbolo" alto={30} decorativo />
          <span className="font-titulo text-medio leading-none">Portal Mamut</span>
        </div>
        <nav aria-label="Secciones" className="flex-1 overflow-y-auto">
          {ctx && <MenuLateral secciones={seccionesDe(rol)} />}
        </nav>
        <div className="flex items-center gap-3 border-t border-borde px-2 pt-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{ctx?.nombre ?? "Sin empresa"}</p>
            <p className="text-chico text-tinta-suave">{ctx ? NOMBRE_ROL[ctx.rol] : "—"}</p>
          </div>
          <form action={salir}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="grid size-11 place-items-center rounded-control text-tinta-suave hover:bg-suave hover:text-tinta"
            >
              <LogOut size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-borde bg-fondo/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
          <Logo logo="simbolo" alto={26} decorativo />
          <span className="font-titulo leading-none">Portal Mamut</span>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          {children}
        </main>

        {ctx && (
          <nav
            aria-label="Secciones"
            data-testid="barra-inferior"
            className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] lg:hidden"
          >
            <BarraInferior secciones={barraInferior(rol)} />
          </nav>
        )}
      </div>
    </div>
  );
}
