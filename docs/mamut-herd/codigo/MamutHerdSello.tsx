// Sello "Un producto de Mamut Herd" para React / Next.js.
// Copia los SVG de la carpeta logos/svg a public/mamut-herd/ y cambia MAMUT_HERD_URL.
//
// Uso:
//   <MamutHerdSello />                       → pie de página, fondo claro
//   <MamutHerdSello fondo="oscuro" />        → fondo oscuro (ej. Prodigia)
//   <MamutHerdSello fondo="blanco" />        → una tinta blanca sobre un color de tu marca
//   <MamutHerdSello forma="apilado" alto={56} /> → pantalla "Acerca de"

const MAMUT_HERD_URL = "MAMUT_HERD_URL";

type Fondo = "claro" | "oscuro" | "blanco" | "negro";
type Forma = "linea" | "apilado";

const archivo: Record<Fondo, string> = {
  claro: "para-fondo-claro",
  oscuro: "para-fondo-oscuro",
  blanco: "una-tinta-blanco",
  negro: "una-tinta-negro",
};

// Proporción ancho/alto de cada forma, para reservar el espacio y evitar saltos.
const proporcion: Record<Forma, number> = { linea: 5.74, apilado: 2.71 };

export function MamutHerdSello({
  fondo = "claro",
  forma = "linea",
  alto = forma === "linea" ? 24 : 56,
  className,
}: { fondo?: Fondo; forma?: Forma; alto?: number; className?: string }) {
  return (
    <a
      href={MAMUT_HERD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ display: "inline-flex", padding: "8px 0" }}
    >
      <img
        src={`/mamut-herd/un-producto-de-mamut-herd-${forma}-${archivo[fondo]}.svg`}
        alt="Un producto de Mamut Herd"
        height={alto}
        width={Math.round(alto * proporcion[forma])}
        style={{ height: alto, width: "auto", display: "block" }}
      />
    </a>
  );
}
