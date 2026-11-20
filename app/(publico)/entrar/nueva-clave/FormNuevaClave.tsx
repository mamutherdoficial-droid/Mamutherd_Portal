"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boton, BotonEnlace } from "@/components/ui/Boton";
import { CampoClave } from "@/components/ui/Campo";
import { crearClienteNavegador } from "@/lib/supabase/browser";

type Paso = "revisando" | "listo" | "sin-enlace";

export function FormNuevaClave() {
  const router = useRouter();
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const [paso, setPaso] = useState<Paso>("revisando");
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  // El enlace del correo trae un código; el cliente de Supabase lo cambia por una sesión al cargar.
  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (vivo) setPaso(data.session ? "listo" : "sin-enlace");
    });
    const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (vivo && sesion && (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN")) setPaso("listo");
    });
    return () => {
      vivo = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (clave.length < 8) return setError("Usa al menos 8 caracteres.");
    if (clave !== repetir) return setError("Las dos contraseñas no son iguales.");
    setError(undefined);
    setGuardando(true);
    const { error: fallo } = await supabase.auth.updateUser({ password: clave });
    setGuardando(false);
    if (fallo) {
      setError(
        fallo.code === "same_password"
          ? "Esa ya es tu contraseña. Escribe una distinta."
          : fallo.code === "weak_password"
            ? "Esa contraseña es muy fácil de adivinar. Prueba con una más larga."
            : "No pudimos guardarla. Pide otro enlace y vuelve a intentar.",
      );
      return;
    }
    router.replace("/hoy");
  }

  if (paso === "revisando") {
    return (
      <p role="status" className="text-center text-tinta-suave">
        Revisando tu enlace…
      </p>
    );
  }

  if (paso === "sin-enlace") {
    return (
      <div className="flex flex-col gap-4" role="alert">
        <p className="rounded-tarjeta border border-borde bg-superficie p-4">
          Este enlace ya no sirve o lo abriste en otro dispositivo. Pide uno nuevo en{" "}
          <strong>Olvidé mi contraseña</strong> y ábrelo en el mismo celular o PC.
        </p>
        <BotonEnlace href="/entrar" ancho>
          Volver a entrar
        </BotonEnlace>
      </div>
    );
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
      <CampoClave
        etiqueta="Contraseña nueva"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres."
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        required
      />
      <CampoClave
        etiqueta="Repítela"
        autoComplete="new-password"
        value={repetir}
        onChange={(e) => setRepetir(e.target.value)}
        error={error}
        required
      />
      <Boton type="submit" ancho disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar y entrar"}
      </Boton>
    </form>
  );
}
