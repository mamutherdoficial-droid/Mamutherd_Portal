"use client";
import { useActionState, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoClave } from "@/components/ui/Campo";
import { crearClienteNavegador } from "@/lib/supabase/browser";
import { entrar, type EstadoEntrar } from "./acciones";

export function FormEntrar({ siguiente }: { siguiente: string }) {
  const [modo, setModo] = useState<"entrar" | "olvide">("entrar");
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(entrar, {});

  if (modo === "olvide") return <FormOlvide volver={() => setModo("entrar")} />;

  return (
    <form action={accion} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="siguiente" value={siguiente} />
      <Campo
        etiqueta="Correo"
        name="correo"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={estado.correo}
        error={estado.campos?.correo}
        required
      />
      <CampoClave
        etiqueta="Contraseña"
        name="clave"
        autoComplete="current-password"
        error={estado.campos?.clave}
        required
      />
      {estado.error && (
        <p role="alert" className="rounded-control border border-error/40 bg-error/10 p-3 font-semibold text-error">
          {estado.error}
        </p>
      )}
      <Boton type="submit" ancho disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Boton>
      <button
        type="button"
        onClick={() => setModo("olvide")}
        className="min-h-12 self-center px-3 font-semibold underline underline-offset-4"
      >
        Olvidé mi contraseña
      </button>
    </form>
  );
}

/**
 * "Olvidé mi contraseña": Supabase manda un correo con un enlace a /entrar/nueva-clave.
 * Se pide desde el navegador para que el enlace funcione en este mismo dispositivo (D-021).
 */
function FormOlvide({ volver }: { volver: () => void }) {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string>();
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = correo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
      setError("Escribe tu correo completo, por ejemplo tu@gmail.com.");
      return;
    }
    setError(undefined);
    setEnviando(true);
    const supabase = crearClienteNavegador();
    const { error: fallo } = await supabase.auth.resetPasswordForEmail(limpio, {
      redirectTo: `${window.location.origin}/entrar/nueva-clave`,
    });
    setEnviando(false);
    if (fallo && fallo.status === 429) {
      setError("Ya pediste un correo hace poco. Espera un minuto y vuelve a intentar.");
      return;
    }
    // Por seguridad no decimos si el correo existe o no.
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <p className="rounded-tarjeta border border-borde bg-superficie p-4">
          Si <strong>{correo.trim()}</strong> tiene cuenta, te llegó un correo para crear otra contraseña.
          Ábrelo en <strong>este mismo celular o PC</strong>.
        </p>
        <Boton variante="secundario" ancho onClick={volver}>
          Volver a entrar
        </Boton>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
      <p className="text-tinta-suave">Escribe tu correo y te mandamos un enlace para crear otra contraseña.</p>
      <Campo
        etiqueta="Correo"
        name="correo"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        error={error}
        required
      />
      <Boton type="submit" ancho disabled={enviando}>
        {enviando ? "Enviando…" : "Mandar enlace"}
      </Boton>
      <Boton variante="fantasma" ancho onClick={volver}>
        Volver
      </Boton>
    </form>
  );
}
