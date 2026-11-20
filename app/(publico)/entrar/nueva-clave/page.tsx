import type { Metadata } from "next";
import { Logo } from "@/components/marca/Logo";
import { FormNuevaClave } from "./FormNuevaClave";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function NuevaClave() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <Logo logo="horizontal" alto={48} />
        <h1 className="font-titulo text-titulo leading-tight">Crea tu contraseña nueva</h1>
      </div>
      <FormNuevaClave />
    </div>
  );
}
