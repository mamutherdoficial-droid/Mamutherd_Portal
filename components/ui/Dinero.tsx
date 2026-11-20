import { formatearPesos } from "@/lib/dominio/dinero";
import { cx } from "./clases";

type Props = { pesos: number; tamano?: "normal" | "grande"; className?: string };

/** Monto en pesos enteros, con números alineados. */
export function Dinero({ pesos, tamano = "normal", className }: Props) {
  return (
    <span
      className={cx(
        "numeros font-bold whitespace-nowrap",
        tamano === "grande" ? "text-grande" : "text-medio",
        className,
      )}
    >
      {formatearPesos(pesos)}
    </span>
  );
}
