"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoClave } from "@/components/ui/Campo";
import { aceptarInvitacion } from "@/lib/acciones/equipo";
import { crearClienteNavegador } from "@/lib/supabase/browser";

type Modo = "crear" | "entrar" | "revisa-correo";

/** Traduce los errores de Supabase Auth a frases simples (el detalle técnico va a la consola). */
function errorAuth(e: { message?: string; status?: number; code?: string }): string {
  console.error("[unirme]", e.status, e.code, e.message);
  const m = (e.message ?? "").toLowerCase();
  if (e.code === "user_already_exists" || m.includes("already registered")) return "Ese correo ya tiene cuenta. Toca «Ya tengo cuenta» y entra.";
  if (e.code === "invalid_credentials" || m.includes("invalid login")) return "El correo o la contraseña no coinciden.";
  if (e.code === "weak_password" || m.includes("password")) return "Usa una contraseña de al menos 8 caracteres.";
  if (e.status === 429) return "Muchos intentos seguidos. Espera un minuto y vuelve a intentar.";
  return "No pudimos crear tu cuenta. Revisa tu conexión y vuelve a intentar.";
}

export function FormUnirme({ token, sesion }: { token: string; sesion: { correo: string | null } | null }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("crear");
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function terminar() {
    const r = await aceptarInvitacion(token);
    if (!r.ok) {
      setError(r.error);
      setEnviando(false);
      return;
    }
    router.replace("/hoy");
    router.refresh();
  }

  if (sesion) {
    return (
      <div className="flex flex-col gap-4">
        <p>
          Entraste como <strong>{sesion.correo ?? "tu cuenta"}</strong>. Toca el botón para unirte con esta cuenta.
        </p>
        {error && (
          <p role="alert" className="rounded-control border border-error/40 bg-error/10 p-3 font-semibold text-error">
            {error}
          </p>
        )}
        <Boton
          ancho
          disabled={enviando}
          onClick={async () => {
            setEnviando(true);
            await terminar();
          }}
        >
          {enviando ? "Uniéndote…" : "Unirme al equipo"}
        </Boton>
      </div>
    );
  }

  if (modo === "revisa-correo") {
    return (
      <div className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4" role="status">
        <p className="font-semibold">Revisa tu correo</p>
        <p>Te mandamos un enlace para confirmar tu cuenta. Ábrelo en este mismo celular: vuelves aquí y terminas.</p>
      </div>
    );
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const correo = String(f.get("correo") ?? "").trim().toLowerCase();
    const clave = String(f.get("clave") ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return setError("Escribe tu correo completo, por ejemplo tu@gmail.com.");
    if (clave.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (modo === "crear" && clave !== String(f.get("clave2") ?? "")) return setError("Las dos contraseñas no coinciden.");
    setError(undefined);
    setEnviando(true);
    const supabase = crearClienteNavegador();

    if (modo === "entrar") {
      const { error: fallo } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
      if (fallo) {
        setEnviando(false);
        return setError(errorAuth(fallo));
      }
      return terminar();
    }

    const { data, error: fallo } = await supabase.auth.signUp({
      email: correo,
      password: clave,
      options: { emailRedirectTo: `${window.location.origin}/unirme?token=${token}` },
    });
    if (fallo) {
      setEnviando(false);
      return setError(errorAuth(fallo));
    }
    if (data.session) return terminar();
    setEnviando(false);
    setModo("revisa-correo");
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate data-testid="form-unirme">
      <Campo etiqueta="Tu correo" name="correo" type="email" autoComplete="email" inputMode="email" required />
      <CampoClave
        etiqueta={modo === "crear" ? "Crea tu contraseña" : "Contraseña"}
        name="clave"
        autoComplete={modo === "crear" ? "new-password" : "current-password"}
        ayuda={modo === "crear" ? "Mínimo 8 caracteres. Solo tú la conoces." : undefined}
        required
      />
      {modo === "crear" && <CampoClave etiqueta="Repite la contraseña" name="clave2" autoComplete="new-password" required />}
      {error && (
        <p role="alert" className="rounded-control border border-error/40 bg-error/10 p-3 font-semibold text-error">
          {error}
        </p>
      )}
      <Boton type="submit" ancho disabled={enviando}>
        {enviando ? "Un momento…" : modo === "crear" ? "Crear mi cuenta" : "Entrar y unirme"}
      </Boton>
      <button
        type="button"
        onClick={() => {
          setError(undefined);
          setModo(modo === "crear" ? "entrar" : "crear");
        }}
        className="min-h-12 self-center px-3 font-semibold underline underline-offset-4"
      >
        {modo === "crear" ? "Ya tengo cuenta" : "Quiero crear una cuenta nueva"}
      </button>
    </form>
  );
}
