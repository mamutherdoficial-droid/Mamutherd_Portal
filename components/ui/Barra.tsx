import { cx } from "./clases";

/** Barra de avance accesible (progressbar). Solo transform para animar. */
export function Barra({ valor, etiqueta, estado = "normal" }: { valor: number; etiqueta: string; estado?: "normal" | "bien" }) {
  const v = Math.max(0, Math.min(100, valor));
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-full bg-suave"
    >
      <div
        className={cx("h-full w-full origin-left rounded-full transition-transform duration-200", estado === "bien" ? "bg-bien" : "bg-ambar")}
        style={{ transform: `scaleX(${v / 100})` }}
      />
    </div>
  );
}
