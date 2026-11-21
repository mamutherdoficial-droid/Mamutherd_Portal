import Link from "next/link";
import { Check, CircleHelp, HandCoins, Sparkles } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import { formatearPesos } from "@/lib/dominio/dinero";
import { PASOS } from "@/lib/guia";
import { marca } from "@/lib/marca";
import { CincoPasos } from "./CincoPasos";

// Portada pública (DESIGN.md → Landing pública). Sin testimonios, clientes ni cifras inventadas:
// solo lo que el portal hace, con un ejemplo de comisión hecho con las reglas reales.

const SEMANA = [
  { dia: "Lunes", texto: "Abres Hoy: a quién volver a llamar y cómo vas con la meta." },
  { dia: "Martes a sábado", texto: "Visitas negocios y anotas cada visita en menos de 20 segundos." },
  { dia: "Cuando alguien paga", texto: "Registras el pago (o lo concilias con el extracto del banco)." },
  { dia: "Día 1 del mes", texto: "Un toque crea las mensualidades de todos tus clientes." },
  { dia: "Domingo", texto: "Abres el resumen de la semana y ajustas el guion con las objeciones." },
];

const ROLES = [
  {
    rol: "Gerente",
    ve: ["Todos los clientes y ventas", "Cobros, pagos y lo que entra", "Lo que le debe a cada persona del equipo", "Inventario y metas"],
  },
  {
    rol: "Ayudante",
    ve: ["Sus clientes y sus ventas", "Sus comisiones y lo que ya le pagaron", "Sus tareas", "Nunca los cobros ni lo que ganan otros"],
  },
];

const AUTOMATICO = [
  "Las comisiones se calculan solas cuando entra un pago, nunca antes.",
  "Las mensualidades del mes se crean con un toque, sin duplicarse.",
  "El extracto del banco propone a qué cobro corresponde cada ingreso; tú confirmas.",
  "Las metas suben solas con cada visita anotada.",
];

const PREGUNTAS = [
  {
    p: "¿Funciona en el celular?",
    r: "Sí. Está hecho primero para el celular (con una mano, en la calle) y también se ve como tablero en el computador.",
  },
  {
    p: "¿Mis vendedores ven lo que gano o lo que cobro?",
    r: "No. Cada ayudante ve solo lo suyo: sus ventas, sus comisiones y sus tareas. Lo garantiza la base de datos, no solo la pantalla.",
  },
  {
    p: "¿Se conecta con mi banco?",
    r: "Subes el extracto de Bancolombia o Nequi (.csv o .xlsx) y el portal propone las coincidencias. Nada se registra sin que tú lo confirmes.",
  },
  {
    p: "¿Qué pasa con los datos de mis clientes?",
    r: "Se usan solo para tu gestión comercial (Ley 1581 de 2012). Solo un gerente puede exportarlos y cada exportación queda registrada.",
  },
  {
    p: "¿Tengo que aprender a usarlo?",
    r: "El portal te enseña solo: la primera vez te guía paso a paso, y siempre tienes la Guía para repetir el recorrido.",
  },
];

export function Portada({ registroAbierto }: { registroAbierto: boolean }) {
  const anticipo = 100_000;
  const total = 200_000;
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-16 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <Logo logo="horizontal" alto={40} />
        <Link href="/entrar" className="inline-flex min-h-12 items-center rounded-control border border-borde px-5 font-semibold hover:bg-suave">
          Entrar
        </Link>
      </header>

      {/* Portada */}
      <section className="flex flex-col gap-5" aria-labelledby="portada-titulo">
        <h1 id="portada-titulo" className="font-titulo text-[2.5rem] leading-[1.05] sm:text-[3.5rem]">
          Tus ventas, tus cobros y tu equipo, en orden.
        </h1>
        <p className="max-w-2xl text-medio text-tinta-suave">
          Anota cada visita en segundos, sabe a quién volver a llamar, cobra a tiempo y paga comisiones sin hacer cuentas a mano. Desde el
          celular.
        </p>
        <div className="flex flex-wrap gap-3">
          {registroAbierto ? (
            <Link href="/registro" className="inline-flex min-h-12 items-center rounded-control bg-principal px-6 font-semibold text-sobre-principal hover:opacity-90">
              Crea tu empresa
            </Link>
          ) : (
            <a
              href={marca.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center rounded-control bg-principal px-6 font-semibold text-sobre-principal hover:opacity-90"
            >
              Quiero usarlo
            </a>
          )}
          <Link href="/entrar" className="inline-flex min-h-12 items-center rounded-control border border-borde px-6 font-semibold hover:bg-suave">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Cómo se usa, en 5 pasos (interactivo) */}
      <section className="flex flex-col gap-5" aria-labelledby="pasos-titulo">
        <h2 id="pasos-titulo" className="font-titulo text-grande leading-tight">
          Cómo se usa, en 5 pasos
        </h2>
        <CincoPasos pasos={PASOS} />
      </section>

      {/* Tu semana */}
      <section className="flex flex-col gap-5" aria-labelledby="semana-titulo">
        <h2 id="semana-titulo" className="font-titulo text-grande leading-tight">
          Tu semana con el portal
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SEMANA.map((s) => (
            <li key={s.dia} className="rounded-tarjeta border border-borde bg-superficie p-4">
              <p className="font-bold">{s.dia}</p>
              <p className="text-tinta-suave">{s.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Qué ve cada rol */}
      <section className="flex flex-col gap-5" aria-labelledby="roles-titulo">
        <h2 id="roles-titulo" className="font-titulo text-grande leading-tight">
          Qué ve cada quien
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r.rol} className="rounded-tarjeta border border-borde bg-superficie p-5">
              <p className="text-medio font-bold">{r.rol}</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {r.ve.map((v) => (
                  <li key={v} className="flex items-start gap-2">
                    <Check size={18} strokeWidth={1.75} aria-hidden className="mt-1 shrink-0 text-bien" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Comisiones con un ejemplo */}
      <section className="flex flex-col gap-5" aria-labelledby="comisiones-titulo">
        <h2 id="comisiones-titulo" className="flex items-center gap-2 font-titulo text-grande leading-tight">
          <HandCoins size={28} strokeWidth={1.75} aria-hidden /> Comisiones, con un ejemplo
        </h2>
        <div className="rounded-tarjeta border border-borde bg-superficie p-5">
          <p>
            Ana consiguió una instalación de <strong className="numeros">{formatearPesos(total)}</strong>. Su acuerdo: 25% de las ventas
            propias.
          </p>
          <ol className="mt-3 flex flex-col gap-2">
            <li>
              1. El negocio paga el anticipo de <strong className="numeros">{formatearPesos(anticipo)}</strong> → Ana ve{" "}
              <strong className="numeros">{formatearPesos(anticipo / 4)}</strong> por cobrar.
            </li>
            <li>
              2. Paga el resto → Ana completa <strong className="numeros">{formatearPesos(total / 4)}</strong>.
            </li>
            <li>3. Si un pago se anula, su comisión pendiente se anula sola.</li>
          </ol>
          <p className="mt-3 text-tinta-suave">Nadie cobra sobre plata que no entró.</p>
        </div>
      </section>

      {/* Cada vez más automático */}
      <section className="flex flex-col gap-5" aria-labelledby="auto-titulo">
        <h2 id="auto-titulo" className="flex items-center gap-2 font-titulo text-grande leading-tight">
          <Sparkles size={28} strokeWidth={1.75} aria-hidden /> Cada vez más automático
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {AUTOMATICO.map((a) => (
            <li key={a} className="rounded-tarjeta border border-borde bg-superficie p-4">
              {a}
            </li>
          ))}
        </ul>
      </section>

      {/* Preguntas frecuentes */}
      <section className="flex flex-col gap-5" aria-labelledby="faq-titulo">
        <h2 id="faq-titulo" className="flex items-center gap-2 font-titulo text-grande leading-tight">
          <CircleHelp size={28} strokeWidth={1.75} aria-hidden /> Preguntas frecuentes
        </h2>
        <div className="flex flex-col divide-y divide-borde rounded-tarjeta border border-borde bg-superficie">
          {PREGUNTAS.map((q) => (
            <details key={q.p} className="group px-5">
              <summary className="min-h-14 cursor-pointer py-4 font-semibold">{q.p}</summary>
              <p className="pb-4 text-tinta-suave">{q.r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-tarjeta bg-principal p-8 text-center text-sobre-principal">
        <p className="font-titulo text-grande leading-tight">¿Listo para ordenar tu semana?</p>
        <Link href="/entrar" className="inline-flex min-h-12 items-center rounded-control bg-superficie px-6 font-semibold text-tinta hover:opacity-90">
          Entrar
        </Link>
      </section>

      <footer className="flex flex-col items-center gap-2 pb-4 text-center text-chico text-tinta-suave">
        <Logo logo="sello-linea" alto={24} />
        <p>
          {marca.firma} · {marca.derechos}
        </p>
      </footer>
    </div>
  );
}
