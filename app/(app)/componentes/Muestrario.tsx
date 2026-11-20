"use client";
import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoClave } from "@/components/ui/Campo";
import { Chip, Estado } from "@/components/ui/Chip";
import { Dinero } from "@/components/ui/Dinero";
import { Hoja } from "@/components/ui/Hoja";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Vacio } from "@/components/ui/Vacio";

const PRODUCTOS = ["Nef", "Antesala", "Tino"];

export function Muestrario({ tema }: { tema: "claro" | "oscuro" }) {
  const [producto, setProducto] = useState("Nef");
  const [hoja, setHoja] = useState(false);

  return (
    <section
      data-tema={tema}
      data-testid={`muestrario-${tema}`}
      aria-label={`Tema ${tema}`}
      className="flex flex-col gap-5 rounded-tarjeta border border-borde p-4 sm:p-5"
    >
      <h2 className="font-titulo text-titulo">Tema {tema}</h2>

      <div className="flex flex-wrap items-center gap-4">
        <Logo logo="horizontal" alto={36} tema={tema} />
        <Logo logo="simbolo" alto={30} tema={tema} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-bold">Botones</h3>
        <div className="flex flex-wrap gap-2">
          <Boton>Principal</Boton>
          <Boton variante="secundario">Secundario</Boton>
          <Boton variante="fantasma">Fantasma</Boton>
          <Boton variante="peligro">Anular</Boton>
          <Boton disabled>Desactivado</Boton>
        </div>
        <Boton variante="ambar" icono={<Plus size={20} strokeWidth={1.75} aria-hidden />}>
          Anotar visita
        </Boton>
        <p className="text-chico text-tinta-suave">El ámbar se usa para una sola cosa por pantalla.</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-bold">Campos</h3>
        <Campo etiqueta="Negocio" placeholder="Café Luna" ayuda="Busca o crea el negocio." />
        <Campo etiqueta="Correo" defaultValue="ana@" error="Escribe tu correo completo, por ejemplo tu@gmail.com." />
        <CampoClave etiqueta="Contraseña" defaultValue="secreta123" />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-bold">Chips</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Producto">
          {PRODUCTOS.map((p) => (
            <Chip key={p} seleccionado={producto === p} onClick={() => setProducto(p)}>
              {p}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Estado estado="bien">Pagado</Estado>
          <Estado estado="alerta">Por vencer</Estado>
          <Estado estado="error">Vencido</Estado>
          <Estado>Pendiente</Estado>
        </div>
      </div>

      <Tarjeta titulo="Tarjeta" accion={<Estado estado="bien">Al día</Estado>}>
        <p className="text-tinta-suave">Por cobrar este mes</p>
        <Dinero pesos={1250000} tamano="grande" />
        <p className="mt-2">
          Instalación Café Luna: <Dinero pesos={200000} />
        </p>
      </Tarjeta>

      <Vacio
        icono={Inbox}
        titulo="Aún no hay visitas esta semana"
        texto="La primera es la más difícil."
      />

      <div>
        <Boton variante="secundario" onClick={() => setHoja(true)}>
          Abrir hoja inferior
        </Boton>
        <Hoja abierta={hoja} alCerrar={() => setHoja(false)} titulo="Hoja de ejemplo">
          <div className="flex flex-col gap-4">
            <p>En el celular sale desde abajo; en el PC, como panel a la derecha.</p>
            <Campo etiqueta="Nota" placeholder="Opcional" />
            <Boton ancho onClick={() => setHoja(false)}>
              Guardar
            </Boton>
          </div>
        </Hoja>
      </div>
    </section>
  );
}
