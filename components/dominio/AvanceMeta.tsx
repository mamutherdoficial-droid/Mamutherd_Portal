import { Barra } from "@/components/ui/Barra";
import { avance, cumplida, NOMBRE_INDICADOR, valorMeta, type Indicador } from "@/lib/dominio/metas";

/** Una meta con su barra: "Visitas · 12 de 25". */
export function AvanceMeta({
  indicador,
  objetivo,
  logrado,
  quien,
}: {
  indicador: string;
  objetivo: number;
  logrado: number;
  quien?: string | null;
}) {
  const nombre = NOMBRE_INDICADOR[indicador as Indicador] ?? indicador;
  const ok = cumplida(logrado, objetivo);
  return (
    <div className="flex flex-col gap-1.5" data-testid={`meta-${indicador}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">
          {nombre}
          {quien && <span className="font-normal text-tinta-suave"> · {quien}</span>}
        </span>
        <span className="numeros text-chico">
          <strong>{valorMeta(indicador, logrado)}</strong> de {valorMeta(indicador, objetivo)}
          {ok && <span className="ml-1 font-semibold text-bien">✓</span>}
        </span>
      </div>
      <Barra valor={avance(logrado, objetivo)} etiqueta={`${nombre}: ${logrado} de ${objetivo}`} estado={ok ? "bien" : "normal"} />
    </div>
  );
}
