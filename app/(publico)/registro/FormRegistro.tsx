"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoClave } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { crearEmpresa } from "@/lib/acciones/producto";
import { crearClienteNavegador } from "@/lib/supabase/browser";

type P = { id: string; nombre: string; descripcion: string };

/** Traduce los errores de Supabase Auth; el detalle técnico va solo a la consola. */
function errorAuth(e: { message?: string; status?: number; code?: string }): string {
  console.error("[registro]", e.status, e.code, e.message);
  const m = (e.message ?? "").toLowerCase();
  if (e.code === "user_already_exists" || m.includes("already registered")) return "Ese correo ya tiene cuenta. Entra y crea la empresa desde Ajustes.";
  if (e.code === "weak_password" || m.includes("password")) return "Usa una contraseña de al menos 8 caracteres.";
  if (e.status === 429) return "Muchos intentos seguidos. Espera un minuto.";
  return "No pudimos crear tu cuenta. Revisa tu conexión y vuelve a intentar.";
}

export function FormRegistro({ conSesion, plantillas }: { conSesion: boolean; plantillas: P[] }) {
  const router = useRouter();
  const [plantilla, setPlantilla] = useState(plantillas[0]?.id ?? "vacia");
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [revisaCorreo, setRevisaCorreo] = useState(false);

  if (revisaCorreo) {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-tarjeta border border-borde bg-superficie p-4">
        <p className="font-semibold">Revisa tu correo</p>
        <p>Confirma tu cuenta con el enlace que te mandamos; vuelves aquí para terminar de crear la empresa.</p>
      </div>
    );
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const nombre = String(f.get("negocio") ?? "").trim();
    const miNombre = String(f.get("minombre") ?? "").trim();
    if (nombre.length < 2) return setError("Escribe el nombre del negocio.");
    if (miNombre.length < 2) return setError("Escribe tu nombre.");
    setError(undefined);
    setEnviando(true);

    if (!conSesion) {
      const correo = String(f.get("correo") ?? "").trim().toLowerCase();
      const clave = String(f.get("clave") ?? "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        setEnviando(false);
        return setError("Escribe tu correo completo.");
      }
      if (clave.length < 8) {
        setEnviando(false);
        return setError("La contraseña debe tener al menos 8 caracteres.");
      }
      const supabase = crearClienteNavegador();
      const { data, error: fallo } = await supabase.auth.signUp({
        email: correo,
        password: clave,
        options: { emailRedirectTo: `${window.location.origin}/registro` },
      });
      if (fallo) {
        setEnviando(false);
        return setError(errorAuth(fallo));
      }
      if (!data.session) {
        setEnviando(false);
        return setRevisaCorreo(true);
      }
    }

    const r = await crearEmpresa({ nombre, miNombre, plantilla });
    if (!r.ok) {
      setEnviando(false);
      return setError(r.error);
    }
    router.replace("/hoy");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate data-testid="form-registro">
      <Campo etiqueta="Nombre del negocio" name="negocio" required autoComplete="organization" />
      <Campo etiqueta="Tu nombre" name="minombre" required autoComplete="name" />
      <fieldset>
        <legend className="mb-2 font-semibold">¿Cómo vendes?</legend>
        <div className="flex flex-col gap-2">
          {plantillas.map((p) => (
            <Chip
              key={p.id}
              seleccionado={plantilla === p.id}
              onClick={() => setPlantilla(p.id)}
              className="!h-auto flex-col !items-start py-2 text-left"
            >
              <span>{p.nombre}</span>
              <span className="font-medium opacity-80">{p.descripcion}</span>
            </Chip>
          ))}
        </div>
        <p className="mt-1 text-chico text-tinta-suave">Es solo un punto de partida: luego cambias productos, precios y comisiones.</p>
      </fieldset>
      {!conSesion && (
        <>
          <Campo etiqueta="Tu correo" name="correo" type="email" autoComplete="email" inputMode="email" required />
          <CampoClave etiqueta="Crea tu contraseña" name="clave" autoComplete="new-password" ayuda="Mínimo 8 caracteres." required />
        </>
      )}
      {error && (
        <p role="alert" className="rounded-control border border-error/40 bg-error/10 p-3 font-semibold text-error">
          {error}
        </p>
      )}
      <Boton type="submit" ancho disabled={enviando}>
        {enviando ? "Creando…" : "Crear empresa"}
      </Boton>
    </form>
  );
}
