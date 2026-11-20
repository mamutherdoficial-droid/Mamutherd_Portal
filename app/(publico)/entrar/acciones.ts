"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { rutaSegura } from "@/lib/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoEntrar = {
  error?: string;
  campos?: { correo?: string; clave?: string };
  correo?: string;
};

const esquema = z.object({
  correo: z.string().trim().toLowerCase().email("Escribe tu correo completo, por ejemplo tu@gmail.com."),
  clave: z.string().min(1, "Escribe tu contraseña."),
  siguiente: z.string().optional(),
});

export async function entrar(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const leido = esquema.safeParse({
    correo: datos.get("correo"),
    clave: datos.get("clave"),
    siguiente: datos.get("siguiente") ?? undefined,
  });
  const correo = String(datos.get("correo") ?? "");

  if (!leido.success) {
    const errores = z.flattenError(leido.error).fieldErrors;
    return { correo, campos: { correo: errores.correo?.[0], clave: errores.clave?.[0] } };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: leido.data.correo,
    password: leido.data.clave,
  });

  if (error) {
    console.error("[entrar]", error.status, error.code, error.message);
    if (error.code === "invalid_credentials") {
      return { correo, error: "El correo o la contraseña no coinciden. Revísalos y vuelve a intentar." };
    }
    if (error.code === "email_not_confirmed") {
      return { correo, error: "Aún no confirmas tu correo. Abre el correo que te llegó y vuelve a entrar." };
    }
    if (error.status === 429) {
      return { correo, error: "Muchos intentos seguidos. Espera un minuto y vuelve a intentar." };
    }
    return { correo, error: "No pudimos entrar. Revisa tu conexión y vuelve a intentar." };
  }

  redirect(rutaSegura(leido.data.siguiente));
}
