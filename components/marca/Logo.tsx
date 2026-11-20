/* eslint-disable @next/next/no-img-element -- SVG de marca tal cual, con <picture> para cambiar con el tema */
import { cx } from "@/components/ui/clases";

// Proporción ancho/alto de cada logo (sale del viewBox de cada SVG del kit).
const LOGOS = {
  horizontal: { archivo: "logo-horizontal", proporcion: 741.28 / 208, alt: "Mamut Herd" },
  simbolo: { archivo: "simbolo", proporcion: 276 / 208, alt: "Mamut Herd" },
  "sello-apilado": {
    archivo: "un-producto-de-mamut-herd-apilado",
    proporcion: 741.28 / 274,
    alt: "Un producto de Mamut Herd",
  },
  "sello-linea": {
    archivo: "un-producto-de-mamut-herd-linea",
    proporcion: 1193.55 / 208,
    alt: "Un producto de Mamut Herd",
  },
} as const;

type Props = {
  logo: keyof typeof LOGOS;
  alto: number;
  className?: string;
  /** true cuando hay texto al lado que ya dice "Mamut Herd". */
  decorativo?: boolean;
  /** Fuerza una versión (solo para /componentes, que muestra claro y oscuro a la vez). */
  tema?: "claro" | "oscuro";
};

/**
 * Logo de Mamut Herd que cambia solo con el tema del sistema (GUIA-DE-USO.md):
 * versión "para-fondo-claro" en modo claro y "para-fondo-oscuro" en modo oscuro.
 */
export function Logo({ logo, alto, className, decorativo, tema }: Props) {
  const { archivo, proporcion, alt } = LOGOS[logo];
  if (tema) {
    return (
      <img
        src={`/marca/${archivo}-para-fondo-${tema}.svg`}
        alt={decorativo ? "" : alt}
        height={alto}
        width={Math.round(alto * proporcion)}
        style={{ height: alto, width: "auto" }}
        className={cx("inline-block shrink-0", className)}
        data-logo={logo}
      />
    );
  }
  return (
    <picture className={cx("inline-block shrink-0", className)}>
      <source srcSet={`/marca/${archivo}-para-fondo-oscuro.svg`} media="(prefers-color-scheme: dark)" />
      <img
        src={`/marca/${archivo}-para-fondo-claro.svg`}
        alt={decorativo ? "" : alt}
        height={alto}
        width={Math.round(alto * proporcion)}
        style={{ height: alto, width: "auto" }}
        data-logo={logo}
      />
    </picture>
  );
}
