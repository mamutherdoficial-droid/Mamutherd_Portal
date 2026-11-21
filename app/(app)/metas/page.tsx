import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, Target } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { AvanceMeta } from "@/components/dominio/AvanceMeta";
import { OfrecerRecorrido } from "@/components/recorrido/Recorridos";
import { Estado } from "@/components/ui/Chip";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Vacio } from "@/components/ui/Vacio";
import { miembrosActivos } from "@/lib/datos";
import { metasEntre, type MetaAvance } from "@/lib/datos-fase4";
import { cumplida } from "@/lib/dominio/metas";
import { diaBogota, fechaLarga, inicioSemana, sumarDias } from "@/lib/dominio/semanas";
import { obtenerContexto } from "@/lib/sesion";
import { PonerMetas } from "./PonerMetas";

export const metadata: Metadata = { title: "Metas" };

export default async function Metas() {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  const esGerente = ctx.rol === "gerente";
  const lunes = inicioSemana(diaBogota());
  const siguiente = sumarDias(lunes, 7);

  const [metas, miembros] = await Promise.all([
    metasEntre(ctx.empresa.id, sumarDias(lunes, -7 * 8), siguiente),
    esGerente ? miembrosActivos(ctx.empresa.id) : Promise.resolve([]),
  ]);
  const deEsta = metas.filter((m) => m.semana === lunes);
  const deLaSiguiente = metas.filter((m) => m.semana === siguiente);
  const anteriores = agrupar(metas.filter((m) => m.semana < lunes));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-grande leading-tight">Metas</h1>
          <p className="text-tinta-suave">Semana del {fechaLarga(lunes).toLowerCase()}.</p>
        </div>
        <Link href="/semana" className="inline-flex min-h-12 items-center gap-2 rounded-control border border-borde px-4 font-semibold hover:bg-suave">
          <CalendarRange size={20} strokeWidth={1.75} aria-hidden /> Resumen de la semana
        </Link>
      </header>

      <Tarjeta titulo="Esta semana" data-recorrido="metas-avance">
        {deEsta.length === 0 ? (
          <Vacio icono={Target} titulo="Sin metas esta semana" texto={esGerente ? "Ponlas abajo: lo que se mide, mejora." : undefined} />
        ) : (
          <div className="flex flex-col gap-4" data-testid="metas-semana">
            {deEsta.map((m) => (
              <AvanceMeta key={m.id} indicador={m.indicador} objetivo={m.objetivo} logrado={m.logrado} quien={m.miembro ?? m.producto} />
            ))}
          </div>
        )}
      </Tarjeta>

      {esGerente && (
        <Tarjeta titulo="Poner metas" data-recorrido="metas-poner">
          <PonerMetas
            semanas={[
              { lunes, texto: "Esta semana" },
              { lunes: siguiente, texto: "La semana siguiente" },
            ]}
            miembros={miembros.filter((m) => m.rol === "ayudante")}
            actuales={[...deEsta, ...deLaSiguiente]
              .filter((m) => !m.producto)
              .map((m) => ({ semana: m.semana, miembroId: m.miembro_id, indicador: m.indicador, objetivo: m.objetivo }))}
          />
        </Tarjeta>
      )}

      <Tarjeta titulo="Semanas anteriores">
        {anteriores.length === 0 ? (
          <p className="text-tinta-suave">Todavía no hay semanas cerradas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borde">
            {anteriores.map((s) => (
              <li key={s.semana} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/semana?lunes=${s.semana}`} className="font-semibold hover:underline">
                  Semana del {fechaLarga(s.semana).toLowerCase()}
                </Link>
                <Estado estado={s.cumplidas === s.total ? "bien" : "alerta"}>
                  {s.cumplidas === s.total ? "Cumplida" : `No cumplida · ${s.cumplidas} de ${s.total}`}
                </Estado>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
      <OfrecerRecorrido id="metas" />
    </div>
  );
}

function agrupar(metas: MetaAvance[]) {
  const porSemana = new Map<string, { semana: string; total: number; cumplidas: number }>();
  for (const m of metas) {
    const s = porSemana.get(m.semana) ?? { semana: m.semana, total: 0, cumplidas: 0 };
    s.total++;
    if (cumplida(m.logrado, m.objetivo)) s.cumplidas++;
    porSemana.set(m.semana, s);
  }
  return [...porSemana.values()].sort((a, b) => b.semana.localeCompare(a.semana));
}
