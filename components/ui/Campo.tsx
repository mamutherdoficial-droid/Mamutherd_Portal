"use client";
import { useId, useState, type ComponentProps } from "react";
import { cx } from "./clases";

type Props = {
  etiqueta: string;
  ayuda?: string;
  error?: string;
} & ComponentProps<"input">;

const control =
  "min-h-12 w-full rounded-control border bg-superficie px-4 text-medio text-tinta " +
  "placeholder:text-tinta-suave focus:outline-2 focus:outline-offset-1 focus:outline-tinta";

/** Campo de texto con etiqueta, ayuda y error que dice qué hacer. */
export function Campo({ etiqueta, ayuda, error, className, id, ...resto }: Props) {
  const propio = useId();
  const campoId = id ?? propio;
  const ayudaId = `${campoId}-ayuda`;
  const errorId = `${campoId}-error`;
  const descrito = [ayuda && ayudaId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={campoId} className="font-semibold">
        {etiqueta}
      </label>
      <input
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={descrito}
        className={cx(control, error ? "border-error" : "border-borde")}
        {...resto}
      />
      {ayuda && !error && (
        <p id={ayudaId} className="text-chico text-tinta-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-chico font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Campo de contraseña con botón "Ver". */
export function CampoClave({ etiqueta, ayuda, error, className, id, ...resto }: Props) {
  const propio = useId();
  const campoId = id ?? propio;
  const [visible, setVisible] = useState(false);
  const errorId = `${campoId}-error`;
  const ayudaId = `${campoId}-ayuda`;
  const descrito = [ayuda && ayudaId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={campoId} className="font-semibold">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={campoId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={descrito}
          className={cx(control, "pr-20", error ? "border-error" : "border-borde")}
          {...resto}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={campoId}
          className="absolute inset-y-1 right-1 min-w-16 rounded-control px-3 text-chico font-semibold text-tinta hover:bg-suave"
        >
          {visible ? "Ocultar" : "Ver"}
        </button>
      </div>
      {ayuda && !error && (
        <p id={ayudaId} className="text-chico text-tinta-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-chico font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
